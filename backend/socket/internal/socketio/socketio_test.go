package socketio

import (
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

type testClient struct {
	t  *testing.T
	ws *websocket.Conn
}

func dial(t *testing.T, srv *httptest.Server) *testClient {
	t.Helper()
	url := "ws" + strings.TrimPrefix(srv.URL, "http") + "/socket.io/?EIO=4&transport=websocket"
	ws, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ws.Close() })
	c := &testClient{t: t, ws: ws}
	if open := c.read(); !strings.HasPrefix(open, "0{") {
		t.Fatalf("expected open packet, got %q", open)
	}
	return c
}

func (c *testClient) send(frame string) {
	c.t.Helper()
	if err := c.ws.WriteMessage(websocket.TextMessage, []byte(frame)); err != nil {
		c.t.Fatal(err)
	}
}

// read returns the next frame, answering server pings transparently.
func (c *testClient) read() string {
	c.t.Helper()
	for {
		_ = c.ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, data, err := c.ws.ReadMessage()
		if err != nil {
			c.t.Fatal(err)
		}
		if string(data) == "2" {
			c.send("3")
			continue
		}
		return string(data)
	}
}

func newTestServer(t *testing.T) (*Server, *httptest.Server) {
	io := NewServer(Options{})
	srv := httptest.NewServer(io)
	t.Cleanup(func() {
		io.Close()
		srv.Close()
	})
	return io, srv
}

func TestEventsAndAcks(t *testing.T) {
	io, srv := newTestServer(t)
	serverAck := make(chan []json.RawMessage, 1)

	io.Use(func(s *Socket) error {
		if s.Handshake().Auth["token"] != "secret" {
			return errors.New("UNAUTHORIZED")
		}
		return nil
	})
	io.OnConnection(func(s *Socket) {
		s.On("echo", func(e *Event) {
			var msg struct{ Text string }
			if err := e.Bind(&msg); err != nil {
				t.Error(err)
			}
			_ = e.Ack(map[string]string{"text": msg.Text + "!"})
		})
		s.On("ask", func(e *Event) {
			go func() {
				ctx, cancel := context.WithTimeout(context.Background(), time.Second)
				defer cancel()
				res, err := s.EmitWithAck(ctx, "question", 42)
				if err != nil {
					t.Error(err)
				}
				serverAck <- res
			}()
		})
	})

	rejected := dial(t, srv)
	rejected.send(`40{"token":"wrong"}`)
	if got := rejected.read(); got != `44{"message":"UNAUTHORIZED"}` {
		t.Fatalf("expected connect_error, got %q", got)
	}

	c := dial(t, srv)
	c.send(`40{"token":"secret"}`)
	if got := c.read(); !strings.HasPrefix(got, `40{"sid":"`) {
		t.Fatalf("expected connect, got %q", got)
	}

	c.send(`4213["echo",{"text":"hi"}]`)
	if got := c.read(); got != `4313[{"text":"hi!"}]` {
		t.Fatalf("unexpected ack %q", got)
	}

	c.send(`42["ask"]`)
	if got := c.read(); got != `420["question",42]` {
		t.Fatalf("unexpected event %q", got)
	}
	c.send(`430["yes"]`)
	select {
	case res := <-serverAck:
		if len(res) != 1 || string(res[0]) != `"yes"` {
			t.Fatalf("unexpected client ack %q", res)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("server did not receive ack")
	}

	c.send(`40/missing,`)
	if got := c.read(); got != `44/missing,{"message":"Invalid namespace"}` {
		t.Fatalf("unexpected reply %q", got)
	}
}

func TestRoomsAndNamespaces(t *testing.T) {
	io, srv := newTestServer(t)
	chat := io.Of("/chat")
	disconnected := make(chan string, 1)

	chat.OnConnection(func(s *Socket) {
		s.On("join", func(e *Event) {
			var room string
			_ = e.Bind(&room)
			s.Join(room)
			_ = e.Ack()
		})
		s.On("say", func(e *Event) {
			var text string
			_ = e.Bind(&text)
			_ = s.To("room1").Emit("said", text)
		})
		s.OnDisconnect(func(reason string) { disconnected <- reason })
	})

	clients := make([]*testClient, 3)
	for i := range clients {
		clients[i] = dial(t, srv)
		clients[i].send(`40/chat,`)
		if got := clients[i].read(); !strings.HasPrefix(got, `40/chat,{"sid":"`) {
			t.Fatalf("expected connect, got %q", got)
		}
	}
	for _, c := range clients[:2] {
		c.send(`42/chat,1["join","room1"]`)
		if got := c.read(); got != `43/chat,1[]` {
			t.Fatalf("unexpected ack %q", got)
		}
	}

	// socket.to(room) excludes the sender and sockets outside the room.
	clients[0].send(`42/chat,["say","hello"]`)
	if got := clients[1].read(); got != `42/chat,["said","hello"]` {
		t.Fatalf("unexpected broadcast %q", got)
	}

	if err := chat.Except("room1").Emit("lonely"); err != nil {
		t.Fatal(err)
	}
	if got := clients[2].read(); got != `42/chat,["lonely"]` {
		t.Fatalf("unexpected broadcast %q", got)
	}
	if n := len(chat.To("room1").Sockets()); n != 2 {
		t.Fatalf("expected 2 sockets in room1, got %d", n)
	}

	clients[0].send(`41/chat,`)
	select {
	case reason := <-disconnected:
		if reason != ReasonClientNamespaceDisconnect {
			t.Fatalf("unexpected reason %q", reason)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("disconnect handler not called")
	}
	if n := len(chat.To("room1").Sockets()); n != 1 {
		t.Fatalf("expected 1 socket in room1, got %d", n)
	}
}

func TestPacketCodec(t *testing.T) {
	p, err := decodePacket(`2/admin,12["msg",1]`)
	if err != nil {
		t.Fatal(err)
	}
	if p.Type != packetEvent || p.Nsp != "/admin" || p.ID == nil || *p.ID != 12 || string(p.Data) != `["msg",1]` {
		t.Fatalf("unexpected packet %+v", p)
	}
	if got := string(p.encode()); got != `42/admin,12["msg",1]` {
		t.Fatalf("unexpected encoding %q", got)
	}
	if _, err := decodePacket(`51-["bin",{"_placeholder":true,"num":0}]`); !errors.Is(err, errBinaryUnsupported) {
		t.Fatalf("expected binary error, got %v", err)
	}
}
