package socketio

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"sync/atomic"
	"time"
)

var (
	ErrReservedEvent = errors.New("socketio: event name is reserved")
	ErrDisconnected  = errors.New("socketio: socket is disconnected")
	ErrNoAck         = errors.New("socketio: event does not expect an acknowledgement")
	ErrAlreadyAcked  = errors.New("socketio: event already acknowledged")
	ErrMissingArgs   = errors.New("socketio: not enough event arguments")
)

// Disconnect reasons, same values as socket.io.
const (
	ReasonClientNamespaceDisconnect = "client namespace disconnect"
	ReasonServerNamespaceDisconnect = "server namespace disconnect"
	ReasonTransportClose            = "transport close"
	ReasonTransportError            = "transport error"
	ReasonPingTimeout               = "ping timeout"
	ReasonParseError                = "parse error"
	ReasonServerShuttingDown        = "server shutting down"
)

var reservedEvents = map[string]struct{}{
	"connect":        {},
	"connect_error":  {},
	"disconnect":     {},
	"disconnecting":  {},
	"newListener":    {},
	"removeListener": {},
}

func isReservedEvent(event string) bool {
	_, ok := reservedEvents[event]
	return ok
}

// Handshake holds the details of the connection request.
type Handshake struct {
	Headers http.Header
	Query   url.Values
	Auth    map[string]any // the `auth` option of the client
	Address string
	Time    time.Time
}

// EventHandler handles an event received from the client.
type EventHandler func(e *Event)

// Event is an event received from the client.
type Event struct {
	Name string
	Args []json.RawMessage

	socket *Socket
	ackID  *uint64
	acked  atomic.Bool
}

// Socket returns the socket that received the event.
func (e *Event) Socket() *Socket { return e.socket }

// Bind decodes the event arguments, in order, into the given pointers.
func (e *Event) Bind(dst ...any) error {
	if len(dst) > len(e.Args) {
		return ErrMissingArgs
	}
	for i, v := range dst {
		if err := json.Unmarshal(e.Args[i], v); err != nil {
			return fmt.Errorf("socketio: decode argument %d of %q: %w", i, e.Name, err)
		}
	}
	return nil
}

// HasAck reports whether the client expects an acknowledgement.
func (e *Event) HasAck() bool { return e.ackID != nil }

// Ack calls the client's acknowledgement callback with the given arguments.
// It can be called at most once.
func (e *Event) Ack(args ...any) error {
	if e.ackID == nil {
		return ErrNoAck
	}
	if !e.acked.CompareAndSwap(false, true) {
		return ErrAlreadyAcked
	}
	data, err := encodeAckData(args)
	if err != nil {
		return err
	}
	return e.socket.send(packet{Type: packetAck, Nsp: e.socket.nsp.name, ID: e.ackID, Data: data})
}

// Socket is a client connected to a namespace, like the `socket` object
// received in `io.on("connection", (socket) => ...)`.
type Socket struct {
	id        string
	nsp       *Namespace
	conn      *conn
	handshake Handshake

	mu                 sync.RWMutex
	handlers           map[string]EventHandler
	anyHandlers        []EventHandler
	disconnectHandlers []func(reason string)
	data               map[string]any
	acks               map[uint64]chan []json.RawMessage
	nextAckID          uint64

	events    chan func()
	done      chan struct{}
	closeOnce sync.Once
	reason    string
}

func newSocket(nsp *Namespace, c *conn, auth map[string]any) *Socket {
	return &Socket{
		id:   generateID(),
		nsp:  nsp,
		conn: c,
		handshake: Handshake{
			Headers: c.req.Header,
			Query:   c.req.URL.Query(),
			Auth:    auth,
			Address: c.req.RemoteAddr,
			Time:    time.Now(),
		},
		handlers: make(map[string]EventHandler),
		data:     make(map[string]any),
		acks:     make(map[uint64]chan []json.RawMessage),
		events:   make(chan func(), 64),
		done:     make(chan struct{}),
	}
}

func (s *Socket) ID() string            { return s.id }
func (s *Socket) Namespace() *Namespace { return s.nsp }
func (s *Socket) Handshake() Handshake  { return s.handshake }
func (s *Socket) Rooms() []string       { return s.nsp.adapter.socketRooms(s.id) }
func (s *Socket) Done() <-chan struct{} { return s.done }
func (s *Socket) Server() *Server       { return s.nsp.server }

// Connected reports whether the socket is still connected.
func (s *Socket) Connected() bool {
	select {
	case <-s.done:
		return false
	default:
		return true
	}
}

// Set stores an arbitrary value on the socket (like `socket.data`).
func (s *Socket) Set(key string, value any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[key] = value
}

// Get returns a value stored with Set.
func (s *Socket) Get(key string) any {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data[key]
}

// On registers the handler of an event. Events of a socket are handled
// sequentially, in the order they were received.
func (s *Socket) On(event string, handler EventHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers[event] = handler
}

// Off removes the handler of an event.
func (s *Socket) Off(event string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.handlers, event)
}

// OnAny registers a handler called for every incoming event, before the
// event-specific handler.
func (s *Socket) OnAny(handler EventHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.anyHandlers = append(s.anyHandlers, handler)
}

// OnDisconnect registers a handler called once the socket is disconnected.
func (s *Socket) OnDisconnect(handler func(reason string)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.disconnectHandlers = append(s.disconnectHandlers, handler)
}

// Emit sends an event to this socket.
func (s *Socket) Emit(event string, args ...any) error {
	if isReservedEvent(event) {
		return ErrReservedEvent
	}
	data, err := encodeEventData(event, args)
	if err != nil {
		return err
	}
	return s.send(packet{Type: packetEvent, Nsp: s.nsp.name, Data: data})
}

// EmitWithAck sends an event and waits for the client's acknowledgement,
// like `socket.timeout(ms).emitWithAck(...)`. Use a context with a deadline.
//
// Do not wait on an acknowledgement for long inside an event handler: the
// socket's events are handled sequentially, so other events queue up meanwhile.
func (s *Socket) EmitWithAck(ctx context.Context, event string, args ...any) ([]json.RawMessage, error) {
	if isReservedEvent(event) {
		return nil, ErrReservedEvent
	}
	data, err := encodeEventData(event, args)
	if err != nil {
		return nil, err
	}

	ch := make(chan []json.RawMessage, 1)
	s.mu.Lock()
	id := s.nextAckID
	s.nextAckID++
	s.acks[id] = ch
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.acks, id)
		s.mu.Unlock()
	}()

	if err := s.send(packet{Type: packetEvent, Nsp: s.nsp.name, ID: &id, Data: data}); err != nil {
		return nil, err
	}

	select {
	case res := <-ch:
		return res, nil
	case <-s.done:
		return nil, ErrDisconnected
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// Join adds the socket to the given rooms.
func (s *Socket) Join(rooms ...string) {
	s.nsp.adapter.addAll(s.id, rooms...)
}

// Leave removes the socket from the given room.
func (s *Socket) Leave(room string) {
	s.nsp.adapter.del(s.id, room)
}

// To targets the sockets in the given rooms, excluding this socket.
func (s *Socket) To(rooms ...string) BroadcastOperator {
	return s.Broadcast().To(rooms...)
}

// In is an alias of To.
func (s *Socket) In(rooms ...string) BroadcastOperator { return s.To(rooms...) }

// Except targets every socket except those in the given rooms and this socket.
func (s *Socket) Except(rooms ...string) BroadcastOperator {
	return s.Broadcast().Except(rooms...)
}

// Broadcast targets every socket of the namespace except this one.
func (s *Socket) Broadcast() BroadcastOperator {
	return BroadcastOperator{nsp: s.nsp, except: []string{s.id}}
}

// Disconnect disconnects the socket from its namespace. When closeConn is
// true, the underlying connection (and every namespace on it) is closed.
func (s *Socket) Disconnect(closeConn bool) {
	if closeConn {
		s.conn.close(ReasonServerNamespaceDisconnect)
		return
	}
	_ = s.send(packet{Type: packetDisconnect, Nsp: s.nsp.name})
	s.close(ReasonServerNamespaceDisconnect)
}

func (s *Socket) send(p packet) error {
	if !s.Connected() {
		return ErrDisconnected
	}
	if !s.conn.write(p.encode()) {
		return ErrDisconnected
	}
	return nil
}

// run handles the socket's events sequentially until it disconnects.
func (s *Socket) run(onConnection []func(*Socket)) {
	for _, fn := range onConnection {
		s.safely(func() { fn(s) })
	}
	for {
		select {
		case fn := <-s.events:
			s.safely(fn)
		case <-s.done:
			s.mu.RLock()
			handlers := s.disconnectHandlers
			s.mu.RUnlock()
			for _, h := range handlers {
				s.safely(func() { h(s.reason) })
			}
			return
		}
	}
}

func (s *Socket) safely(fn func()) {
	defer func() {
		if r := recover(); r != nil {
			s.nsp.server.logf("socketio: panic in handler of socket %s: %v", s.id, r)
		}
	}()
	fn()
}

func (s *Socket) onPacket(p packet) {
	switch p.Type {
	case packetEvent:
		var args []json.RawMessage
		var name string
		if json.Unmarshal(p.Data, &args) != nil || len(args) == 0 || json.Unmarshal(args[0], &name) != nil {
			s.conn.close(ReasonParseError)
			return
		}
		e := &Event{Name: name, Args: args[1:], socket: s, ackID: p.ID}
		select {
		case s.events <- func() { s.dispatch(e) }:
		case <-s.done:
		}

	case packetAck:
		if p.ID == nil {
			return
		}
		var args []json.RawMessage
		_ = json.Unmarshal(p.Data, &args)
		s.mu.Lock()
		ch := s.acks[*p.ID]
		delete(s.acks, *p.ID)
		s.mu.Unlock()
		if ch != nil {
			ch <- args
		}

	case packetDisconnect:
		s.close(ReasonClientNamespaceDisconnect)
	}
}

func (s *Socket) dispatch(e *Event) {
	s.mu.RLock()
	anyHandlers := s.anyHandlers
	handler := s.handlers[e.Name]
	s.mu.RUnlock()

	for _, h := range anyHandlers {
		h(e)
	}
	if handler != nil {
		handler(e)
	}
}

func (s *Socket) close(reason string) {
	s.closeOnce.Do(func() {
		s.reason = reason
		s.nsp.remove(s)
		s.conn.removeSocket(s.nsp.name)
		close(s.done)
	})
}
