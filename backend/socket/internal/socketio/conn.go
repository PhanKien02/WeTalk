package socketio

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const writeWait = 10 * time.Second

// conn is an Engine.IO connection over the websocket transport. It carries
// one Socket per connected namespace.
type conn struct {
	server *Server
	ws     *websocket.Conn
	sid    string
	req    *http.Request

	send      chan []byte
	done      chan struct{}
	closeOnce sync.Once

	mu      sync.Mutex
	sockets map[string]*Socket // namespace name -> socket
}

func newConn(server *Server, ws *websocket.Conn, req *http.Request) *conn {
	return &conn{
		server:  server,
		ws:      ws,
		sid:     generateID(),
		req:     req,
		send:    make(chan []byte, server.opts.SendBufferSize),
		done:    make(chan struct{}),
		sockets: make(map[string]*Socket),
	}
}

func (c *conn) serve() {
	opts := c.server.opts

	handshake, _ := json.Marshal(map[string]any{
		"sid":          c.sid,
		"upgrades":     []string{},
		"pingInterval": opts.PingInterval.Milliseconds(),
		"pingTimeout":  opts.PingTimeout.Milliseconds(),
		"maxPayload":   opts.MaxPayload,
	})
	c.write(append([]byte{eioOpen}, handshake...))

	// Like socket.io, drop connections that never join a namespace.
	timer := time.AfterFunc(opts.ConnectTimeout, func() {
		c.mu.Lock()
		idle := len(c.sockets) == 0
		c.mu.Unlock()
		if idle {
			c.close(ReasonTransportClose)
		}
	})
	defer timer.Stop()

	go c.writePump()
	c.readPump()
}

func (c *conn) readPump() {
	opts := c.server.opts
	c.ws.SetReadLimit(opts.MaxPayload)

	// The server pings every PingInterval; the client must answer (or send
	// anything) within PingTimeout.
	extend := func() { _ = c.ws.SetReadDeadline(time.Now().Add(opts.PingInterval + opts.PingTimeout)) }
	extend()

	reason := ReasonTransportClose
	for {
		msgType, data, err := c.ws.ReadMessage()
		if err != nil {
			var netErr net.Error
			if errors.As(err, &netErr) && netErr.Timeout() {
				reason = ReasonPingTimeout
			} else if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
				reason = ReasonTransportError
			}
			break
		}
		extend()

		if msgType != websocket.TextMessage || len(data) == 0 {
			continue
		}
		switch data[0] {
		case eioMessage:
			c.onPacket(string(data[1:]))
		case eioPing:
			c.write(append([]byte{eioPong}, data[1:]...))
		case eioClose:
			c.close(ReasonTransportClose)
			return
		}
	}
	c.close(reason)
}

func (c *conn) writePump() {
	ticker := time.NewTicker(c.server.opts.PingInterval)
	defer func() {
		ticker.Stop()
		_ = c.ws.Close()
	}()

	for {
		select {
		case msg := <-c.send:
			if err := c.writeFrame(msg); err != nil {
				c.close(ReasonTransportError)
				return
			}
		case <-ticker.C:
			if err := c.writeFrame([]byte{eioPing}); err != nil {
				c.close(ReasonTransportError)
				return
			}
		case <-c.done:
			// Flush what is queued (e.g. a disconnect packet) before closing.
			for {
				select {
				case msg := <-c.send:
					if c.writeFrame(msg) != nil {
						return
					}
				default:
					_ = c.ws.WriteControl(websocket.CloseMessage,
						websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
						time.Now().Add(writeWait))
					return
				}
			}
		}
	}
}

func (c *conn) writeFrame(msg []byte) error {
	_ = c.ws.SetWriteDeadline(time.Now().Add(writeWait))
	return c.ws.WriteMessage(websocket.TextMessage, msg)
}

// write queues a frame. A client that does not keep up with its send buffer
// is disconnected rather than blocking the caller.
func (c *conn) write(msg []byte) bool {
	select {
	case <-c.done:
		return false
	default:
	}
	select {
	case c.send <- msg:
		return true
	case <-c.done:
		return false
	default:
		go c.close(ReasonTransportError)
		return false
	}
}

func (c *conn) onPacket(raw string) {
	p, err := decodePacket(raw)
	if err != nil {
		c.close(ReasonParseError)
		return
	}
	if p.Type == packetConnect {
		c.connect(p)
		return
	}

	c.mu.Lock()
	s := c.sockets[p.Nsp]
	c.mu.Unlock()
	if s != nil {
		s.onPacket(p)
	}
}

func (c *conn) connect(p packet) {
	connectError := func(message string) {
		c.write(packet{Type: packetConnectError, Nsp: p.Nsp, Data: errorData(message)}.encode())
	}

	nsp, ok := c.server.namespace(p.Nsp)
	if !ok {
		connectError("Invalid namespace")
		return
	}

	c.mu.Lock()
	_, exists := c.sockets[p.Nsp]
	c.mu.Unlock()
	if exists {
		return
	}

	var auth map[string]any
	if len(p.Data) > 0 {
		if err := json.Unmarshal(p.Data, &auth); err != nil {
			connectError("Invalid auth payload")
			return
		}
	}
	if auth == nil {
		auth = map[string]any{}
	}

	s := newSocket(nsp, c, auth)
	if err := nsp.runMiddlewares(s); err != nil {
		connectError(err.Error())
		return
	}

	c.mu.Lock()
	c.sockets[p.Nsp] = s
	c.mu.Unlock()

	onConnection := nsp.add(s)
	data, _ := json.Marshal(map[string]string{"sid": s.id})
	c.write(packet{Type: packetConnect, Nsp: p.Nsp, Data: data}.encode())

	go s.run(onConnection)

	// The connection may have been closed while the middlewares were running.
	select {
	case <-c.done:
		s.close(ReasonTransportClose)
	default:
	}
}

func (c *conn) removeSocket(nsp string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.sockets, nsp)
}

func (c *conn) close(reason string) {
	c.closeOnce.Do(func() {
		close(c.done)
		c.server.removeConn(c)

		c.mu.Lock()
		sockets := make([]*Socket, 0, len(c.sockets))
		for _, s := range c.sockets {
			sockets = append(sockets, s)
		}
		c.mu.Unlock()

		for _, s := range sockets {
			s.close(reason)
		}
	})
}
