package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 64 * 1024
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Development default. Restrict this to your frontend origin in production.
		return true
	},
}

type Client struct {
	SocketID string
	UserID   string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub

	closeOnce sync.Once
	done      chan struct{}
}

func (c *Client) enqueue(data []byte) bool {
	select {
	case <-c.done:
		return false
	default:
	}
	select {
	case <-c.done:
		return false
	case c.Send <- data:
		return true
	default:
		return false
	}
}

func (c *Client) enqueueJSON(v any) {
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	c.enqueue(data)
}

func (c *Client) closeSendOnce() {
	c.closeOnce.Do(func() { close(c.done) })
}

func (c *Client) requestUnregister() {
	done := make(chan struct{})
	c.Hub.unregister <- unregisterRequest{Client: c, Done: done}
	<-done
	_ = c.Conn.Close()
}

func (h *Hub) ServeWS(ctx *gin.Context) {
	userIDValue, exists := ctx.Get("userId")
	userID, valid := userIDValue.(string)
	if !exists || !valid {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error":   "UNAUTHORIZED",
			"message": "Token does not contain a valid user id",
			"success": false,
			"data":    nil,
		})
		return
	}
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Printf("websocket upgrade failed: %v", err)
		return
	}

	client := &Client{
		SocketID: uuid.NewString(),
		UserID:   userID,
		Conn:     conn,
		Send:     make(chan []byte, writeQueueSize),
		Hub:      h,
		done:     make(chan struct{}),
	}
	fmt.Print(client)
	h.register <- client
	go client.writePump()
	client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		done := make(chan struct{})
		c.Hub.unregister <- unregisterRequest{Client: c, Done: done}
		<-done
		_ = c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		return c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, data, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket read error user=%s socket=%s: %v", c.UserID, c.SocketID, err)
			}
			return
		}

		var msg IncomingMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			c.enqueueJSON(OutgoingMessage{Type: "error", Error: "invalid JSON message", Time: time.Now().UTC()})
			continue
		}

		switch msg.Type {
		case "direct":
			if msg.ToUser == "" || msg.Content == "" {
				c.enqueueJSON(OutgoingMessage{Type: "error", Error: "toUserId and content are required", Time: time.Now().UTC()})
				continue
			}
			c.Hub.direct <- DirectMessage{FromUser: c.UserID, ToUser: msg.ToUser, Content: msg.Content}

		case "group":
			if msg.GroupID == "" || msg.Content == "" {
				c.enqueueJSON(OutgoingMessage{Type: "error", Error: "groupId and content are required", Time: time.Now().UTC()})
				continue
			}
			c.Hub.group <- GroupMessage{FromUser: c.UserID, GroupID: msg.GroupID, Content: msg.Content}

		case "join_group":
			if msg.GroupID == "" {
				c.enqueueJSON(OutgoingMessage{Type: "error", Error: "groupId is required", Time: time.Now().UTC()})
				continue
			}
			// IMPORTANT: authorize membership against your database before allowing this.
			c.Hub.joinGroup(c.UserID, msg.GroupID)
			c.enqueueJSON(OutgoingMessage{Type: "joined_group", GroupID: msg.GroupID, Time: time.Now().UTC()})

		case "leave_group":
			if msg.GroupID == "" {
				continue
			}
			c.Hub.leaveGroup(c.UserID, msg.GroupID)
			c.enqueueJSON(OutgoingMessage{Type: "left_group", GroupID: msg.GroupID, Time: time.Now().UTC()})

		case "ping":
			c.enqueueJSON(OutgoingMessage{Type: "pong", Time: time.Now().UTC()})

		default:
			c.enqueueJSON(OutgoingMessage{Type: "error", Error: "unknown message type", Time: time.Now().UTC()})
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.Conn.Close()
	}()

	for {
		select {
		case <-c.done:
			return
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
