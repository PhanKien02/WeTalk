package socketio

import "sync"

// Middleware runs before a socket joins a namespace. Returning an error
// rejects the connection; the client receives a "connect_error" with the
// error message.
type Middleware func(s *Socket) error

// Namespace is a communication channel that multiplexes a single connection,
// like `io.of("/admin")` in socket.io.
type Namespace struct {
	name    string
	server  *Server
	adapter *adapter

	mu           sync.RWMutex
	sockets      map[string]*Socket
	middlewares  []Middleware
	onConnection []func(s *Socket)
}

func newNamespace(server *Server, name string) *Namespace {
	return &Namespace{
		name:    name,
		server:  server,
		adapter: newAdapter(),
		sockets: make(map[string]*Socket),
	}
}

// Name returns the namespace name, e.g. "/".
func (n *Namespace) Name() string { return n.name }

// Use registers a middleware executed for every incoming socket, in order.
func (n *Namespace) Use(m Middleware) {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.middlewares = append(n.middlewares, m)
}

// OnConnection registers a handler called for every socket that connects.
// Register the socket's event handlers inside it.
func (n *Namespace) OnConnection(fn func(s *Socket)) {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.onConnection = append(n.onConnection, fn)
}

// To targets the sockets in the given rooms.
func (n *Namespace) To(rooms ...string) BroadcastOperator {
	return BroadcastOperator{nsp: n}.To(rooms...)
}

// In is an alias of To.
func (n *Namespace) In(rooms ...string) BroadcastOperator { return n.To(rooms...) }

// Except targets every socket except those in the given rooms.
func (n *Namespace) Except(rooms ...string) BroadcastOperator {
	return BroadcastOperator{nsp: n}.Except(rooms...)
}

// Emit sends an event to every socket in the namespace.
func (n *Namespace) Emit(event string, args ...any) error {
	return BroadcastOperator{nsp: n}.Emit(event, args...)
}

// Sockets returns the connected sockets of the namespace.
func (n *Namespace) Sockets() []*Socket {
	return BroadcastOperator{nsp: n}.Sockets()
}

// Socket returns the connected socket with the given ID, if any.
func (n *Namespace) Socket(id string) (*Socket, bool) {
	n.mu.RLock()
	defer n.mu.RUnlock()
	s, ok := n.sockets[id]
	return s, ok
}

func (n *Namespace) runMiddlewares(s *Socket) error {
	n.mu.RLock()
	middlewares := n.middlewares
	n.mu.RUnlock()

	for _, m := range middlewares {
		if err := m(s); err != nil {
			return err
		}
	}
	return nil
}

func (n *Namespace) add(s *Socket) []func(*Socket) {
	n.mu.Lock()
	n.sockets[s.id] = s
	handlers := n.onConnection
	n.mu.Unlock()

	n.adapter.addAll(s.id, s.id)
	return handlers
}

func (n *Namespace) remove(s *Socket) {
	n.mu.Lock()
	delete(n.sockets, s.id)
	n.mu.Unlock()

	n.adapter.delAll(s.id)
}
