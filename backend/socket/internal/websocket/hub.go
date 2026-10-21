package ws

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	writeQueueSize = 256
)

type Hub struct {
	// Only the Hub.Run goroutine may read or mutate these maps.
	clients map[string]map[*Client]struct{} // userID -> all active device/tab connections
	groups  map[string]map[string]struct{}  // groupID -> userIDs

	register   chan *Client
	unregister chan unregisterRequest
	direct     chan DirectMessage
	group      chan GroupMessage
	membership chan GroupMembershipRequest
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]struct{}),
		groups:     make(map[string]map[string]struct{}),
		register:   make(chan *Client),
		unregister: make(chan unregisterRequest),
		direct:     make(chan DirectMessage),
		group:      make(chan GroupMessage),
		membership: make(chan GroupMembershipRequest),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			connections := h.clients[client.UserID]
			if connections == nil {
				connections = make(map[*Client]struct{})
				h.clients[client.UserID] = connections
			}
			connections[client] = struct{}{}
			client.enqueueJSON(OutgoingMessage{
				Type: "connected", SocketID: client.SocketID, Time: time.Now().UTC(),
			})

		case req := <-h.unregister:
			h.removeClient(req.Client)
			if req.Done != nil {
				close(req.Done)
			}

		case req := <-h.membership:
			if req.Join {
				members := h.groups[req.GroupID]
				if members == nil {
					members = make(map[string]struct{})
					h.groups[req.GroupID] = members
				}
				members[req.UserID] = struct{}{}
			} else {
				if members := h.groups[req.GroupID]; members != nil {
					delete(members, req.UserID)
					if len(members) == 0 {
						delete(h.groups, req.GroupID)
					}
				}
			}

		case msg := <-h.direct:
			if msg.ToUser == "" || msg.FromUser == "" {
				continue
			}
			out := OutgoingMessage{
				Type: "direct", MessageID: uuid.NewString(), FromUser: msg.FromUser,
				ToUser: msg.ToUser, Content: msg.Content, Time: time.Now().UTC(),
			}
			h.sendToUser(msg.ToUser, out)
			// Echo to sender's other devices, too; avoid sending twice to originating socket
			// by default this sends to all sender devices, which may include originating one.
			h.sendToUser(msg.FromUser, OutgoingMessage{
				Type: "direct_sent", MessageID: out.MessageID, FromUser: msg.FromUser,
				ToUser: msg.ToUser, Content: msg.Content, Time: out.Time,
			})

		case msg := <-h.group:
			members := h.groups[msg.GroupID]
			if msg.FromUser == "" || msg.GroupID == "" {
				continue
			}
			if _, isMember := members[msg.FromUser]; !isMember {
				h.sendToUser(msg.FromUser, OutgoingMessage{
					Type: "error", Error: "you are not a member of this group", Time: time.Now().UTC(),
				})
				continue
			}
			out := OutgoingMessage{
				Type: "group", MessageID: uuid.NewString(), FromUser: msg.FromUser,
				GroupID: msg.GroupID, Content: msg.Content, Time: time.Now().UTC(),
			}
			for userID := range members {
				h.sendToUser(userID, out)
			}
		}
	}
}

func (h *Hub) removeClient(client *Client) {
	if client == nil {
		return
	}
	connections := h.clients[client.UserID]
	if _, exists := connections[client]; !exists {
		return
	}
	delete(connections, client)
	client.closeSendOnce()
	if len(connections) == 0 {
		delete(h.clients, client.UserID)
	}
}

func (h *Hub) sendToUser(userID string, message OutgoingMessage) {
	connections := h.clients[userID]
	if len(connections) == 0 {
		return
	}
	data, err := json.Marshal(message)
	if err != nil {
		return
	}
	for client := range connections {
		if !client.enqueue(data) {
			// Queue is full: disconnect only this slow connection.
			// Schedule removal through Hub rather than mutating maps here.
			go client.requestUnregister()
		}
	}
}

func (h *Hub) joinGroup(userID, groupID string) {
	h.membership <- GroupMembershipRequest{UserID: userID, GroupID: groupID, Join: true}
}

func (h *Hub) leaveGroup(userID, groupID string) {
	h.membership <- GroupMembershipRequest{UserID: userID, GroupID: groupID, Join: false}
}
