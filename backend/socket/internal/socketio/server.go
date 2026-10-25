// Package socketio is a Socket.IO server built on gorilla/websocket.
//
// It speaks the Socket.IO v5 / Engine.IO v4 protocol over the websocket
// transport, so the official `socket.io-client` (v3+) can connect with
// `transports: ["websocket"]`. HTTP long-polling and binary attachments are
// not supported.
package socketio

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Options configures a Server. Zero values fall back to socket.io defaults.
type Options struct {
	PingInterval   time.Duration // default 25s
	PingTimeout    time.Duration // default 20s
	ConnectTimeout time.Duration // time allowed to join a namespace, default 45s
	MaxPayload     int64         // max incoming frame size in bytes, default 1MB
	SendBufferSize int           // queued outgoing frames per connection, default 256

	// CheckOrigin validates the Origin header. When nil, gorilla/websocket's
	// same-origin check is used.
	CheckOrigin func(r *http.Request) bool

	// Logf logs internal errors such as handler panics. Defaults to log.Printf.
	Logf func(format string, args ...any)
}

func (o Options) withDefaults() Options {
	if o.PingInterval <= 0 {
		o.PingInterval = 25 * time.Second
	}
	if o.PingTimeout <= 0 {
		o.PingTimeout = 20 * time.Second
	}
	if o.ConnectTimeout <= 0 {
		o.ConnectTimeout = 45 * time.Second
	}
	if o.MaxPayload <= 0 {
		o.MaxPayload = 1_000_000
	}
	if o.SendBufferSize <= 0 {
		o.SendBufferSize = 256
	}
	if o.Logf == nil {
		o.Logf = log.Printf
	}
	return o
}

// Server is the Socket.IO server. It implements http.Handler and should be
// mounted on "/socket.io/".
type Server struct {
	opts     Options
	upgrader websocket.Upgrader

	mu         sync.RWMutex
	namespaces map[string]*Namespace
	conns      map[string]*conn
	closed     bool
}

// NewServer creates a server with the default namespace "/".
func NewServer(opts Options) *Server {
	opts = opts.withDefaults()
	s := &Server{
		opts: opts,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     opts.CheckOrigin,
		},
		namespaces: make(map[string]*Namespace),
		conns:      make(map[string]*conn),
	}
	s.upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}
	s.Of("/")
	return s
}

// Of returns the namespace with the given name, creating it if needed.
func (s *Server) Of(name string) *Namespace {
	if name == "" || name[0] != '/' {
		name = "/" + name
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	nsp, ok := s.namespaces[name]
	if !ok {
		nsp = newNamespace(s, name)
		s.namespaces[name] = nsp
	}
	return nsp
}

// The methods below are shortcuts for the default namespace "/".

func (s *Server) Use(m Middleware)                         { s.Of("/").Use(m) }
func (s *Server) OnConnection(fn func(*Socket))            { s.Of("/").OnConnection(fn) }
func (s *Server) To(rooms ...string) BroadcastOperator     { return s.Of("/").To(rooms...) }
func (s *Server) In(rooms ...string) BroadcastOperator     { return s.Of("/").In(rooms...) }
func (s *Server) Except(rooms ...string) BroadcastOperator { return s.Of("/").Except(rooms...) }
func (s *Server) Emit(event string, args ...any) error     { return s.Of("/").Emit(event, args...) }
func (s *Server) Sockets() []*Socket                       { return s.Of("/").Sockets() }

func (s *Server) namespace(name string) (*Namespace, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	nsp, ok := s.namespaces[name]
	return nsp, ok
}

// Engine.IO handshake error codes.
const (
	errCodeTransportUnknown   = 0
	errCodeBadRequest         = 3
	errCodeUnsupportedVersion = 5
)

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	switch {
	case q.Get("EIO") != "4":
		handshakeError(w, errCodeUnsupportedVersion, "Unsupported protocol version")
		return
	case q.Get("transport") != "websocket":
		handshakeError(w, errCodeTransportUnknown, "Transport unknown")
		return
	case q.Get("sid") != "":
		// Only direct websocket connections are supported, no upgrade from polling.
		handshakeError(w, errCodeBadRequest, "Bad request")
		return
	}

	ws, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return // the upgrader already wrote the HTTP error
	}

	c := newConn(s, ws, r)
	if !s.addConn(c) {
		_ = ws.Close()
		return
	}
	c.serve()
}

// Close disconnects every client. Clients will try to reconnect.
func (s *Server) Close() {
	s.mu.Lock()
	s.closed = true
	conns := make([]*conn, 0, len(s.conns))
	for _, c := range s.conns {
		conns = append(conns, c)
	}
	s.mu.Unlock()

	for _, c := range conns {
		c.close(ReasonServerShuttingDown)
	}
}

func (s *Server) addConn(c *conn) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return false
	}
	s.conns[c.sid] = c
	return true
}

func (s *Server) removeConn(c *conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.conns, c.sid)
}

func (s *Server) logf(format string, args ...any) {
	s.opts.Logf(format, args...)
}

func handshakeError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(map[string]any{"code": code, "message": message})
}

func generateID() string {
	b := make([]byte, 15)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}
