package events

import (
	"context"
	"slices"
	"time"

	"socket/internal/client"
	"socket/internal/socketio"
)

const membershipTimeout = 5 * time.Second

// ConversationRoom holds the sockets that currently have the conversation open.
func ConversationRoom(conversationId string) string {
	return "conversation:" + conversationId
}

type conversationRequest struct {
	ConversationId string `json:"conversationId"`
}

type typingRequest struct {
	ConversationId string `json:"conversationId"`
	IsTyping       bool   `json:"isTyping"`
}

type typingPayload struct {
	ConversationId string `json:"conversationId"`
	UserId         string `json:"userId"`
	IsTyping       bool   `json:"isTyping"`
}

type joinAck struct {
	Ok            bool     `json:"ok"`
	Error         string   `json:"error,omitempty"`
	OnlineUserIds []string `json:"onlineUserIds,omitempty"`
}

func ack(e *socketio.Event, payload any) {
	if e.HasAck() {
		_ = e.Ack(payload)
	}
}

// registerConversationRoom handles the events of an open conversation:
//
//	socket.emit("conversation:join", { conversationId }, (res) => ...)
//	socket.emit("conversation:leave", { conversationId })
//	socket.emit("typing", { conversationId, isTyping })
func registerConversationRoom(s *socketio.Socket, userID string, conversations client.ConversationClient) {
	s.On(EventConversationJoin, func(e *socketio.Event) {
		var req conversationRequest
		if err := e.Bind(&req); err != nil || req.ConversationId == "" {
			ack(e, joinAck{Error: "conversationId is required"})
			return
		}
		if userID == "" {
			ack(e, joinAck{Error: "unauthorized"})
			return
		}

		// The membership check is an HTTP call; run it off the socket's event
		// loop so typing events are not held up behind it.
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), membershipTimeout)
			defer cancel()

			conversation, err := conversations.FindById(ctx, req.ConversationId, userID)
			if err != nil || !conversation.HasMember(userID) {
				ack(e, joinAck{Error: "forbidden"})
				return
			}
			if !s.Connected() {
				return
			}

			s.Join(ConversationRoom(conversation.Id))
			for _, memberId := range conversation.MemberIds {
				if memberId != userID {
					s.Join(PresenceRoom(memberId))
				}
			}
			ack(e, joinAck{Ok: true, OnlineUserIds: OnlineUserIds(conversation.MemberIds)})
		}()
	})

	s.On(EventConversationLeave, func(e *socketio.Event) {
		var req conversationRequest
		if err := e.Bind(&req); err != nil || req.ConversationId == "" {
			return
		}
		room := ConversationRoom(req.ConversationId)
		if slices.Contains(s.Rooms(), room) {
			s.Leave(room)
			// Presence rooms are kept: other open conversations may share members.
			_ = s.To(room).Except(UserRoom(userID)).Emit(EventTyping, typingPayload{
				ConversationId: req.ConversationId, UserId: userID, IsTyping: false,
			})
		}
	})

	s.On(EventTyping, func(e *socketio.Event) {
		var req typingRequest
		if err := e.Bind(&req); err != nil || userID == "" {
			return
		}
		// Only a socket that passed the membership check on join may broadcast.
		room := ConversationRoom(req.ConversationId)
		if !slices.Contains(s.Rooms(), room) {
			return
		}
		// Except the user's room so their other tabs do not see themselves typing.
		_ = s.To(room).Except(UserRoom(userID)).Emit(EventTyping, typingPayload{
			ConversationId: req.ConversationId, UserId: userID, IsTyping: req.IsTyping,
		})
	})
}
