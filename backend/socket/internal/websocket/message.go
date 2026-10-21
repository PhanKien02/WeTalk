package ws

import "time"

// IncomingMessage is the client-to-server JSON envelope.
type IncomingMessage struct {
	Type    string `json:"type"` // direct, group, join_group, leave_group, ping
	ToUser  string `json:"toUserId,omitempty"`
	GroupID string `json:"groupId,omitempty"`
	Content string `json:"content,omitempty"`
}

// OutgoingMessage is the server-to-client JSON envelope.
type OutgoingMessage struct {
	Type      string    `json:"type"`
	MessageID string    `json:"messageId,omitempty"`
	FromUser  string    `json:"fromUserId,omitempty"`
	ToUser    string    `json:"toUserId,omitempty"`
	GroupID   string    `json:"groupId,omitempty"`
	Content   string    `json:"content,omitempty"`
	SocketID  string    `json:"socketId,omitempty"`
	Time      time.Time `json:"time"`
	Error     string    `json:"error,omitempty"`
}

type DirectMessage struct {
	FromUser string
	ToUser   string
	Content  string
}

type GroupMessage struct {
	FromUser string
	GroupID  string
	Content  string
}

type GroupMembershipRequest struct {
	UserID  string
	GroupID string
	Join    bool
}

type unregisterRequest struct {
	Client *Client
	Done   chan struct{}
}
