package events

import (
	"context"
	"log"

	"socket/internal/client"
	"socket/internal/socketio"
	"socket/redis"
)

func UserRoom(userID string) string {
	return "user:" + userID
}

func userSocketsKey(userID string) string {
	return "socket:user:" + userID
}

// UserID returns the id set by middleware.SocketAuth, or "" for a guest.
func UserID(s *socketio.Socket) string {
	userID, _ := s.Get("userId").(string)
	return userID
}

func SaveSocketId(socketId, userId string) {
	ctx := context.Background()
	if err := redis.GetInstance(ctx).SAdd(ctx, userSocketsKey(userId), socketId).Err(); err != nil {
		log.Printf("save socket id failed: id=%s user=%s err=%v", socketId, userId, err)
	}
}

func GetSocketIds(userId string) []string {
	ctx := context.Background()
	res, err := redis.GetInstance(ctx).SMembers(ctx, userSocketsKey(userId)).Result()
	if err != nil {
		log.Printf("get socket ids failed: user=%s err=%v", userId, err)
	}
	return res
}

func DeleteSocketId(socketId, userId string) {
	ctx := context.Background()
	if err := redis.GetInstance(ctx).SRem(ctx, userSocketsKey(userId), socketId).Err(); err != nil {
		log.Printf("delete socket id failed: id=%s user=%s err=%v", socketId, userId, err)
	}
}

func Register(io *socketio.Server, conversations client.ConversationClient) {
	io.OnConnection(func(s *socketio.Socket) {
		userID := UserID(s)
		log.Printf("socket connected: id=%s user=%s", s.ID(), userID)

		// Only authenticated sockets are tracked; guests have no user id.
		if userID != "" {
			SaveSocketId(s.ID(), userID)
			s.Join(UserRoom(userID))
			// The first socket of a user brings them online.
			if socketCount(userID) == 1 {
				emitPresence(io, userID, true)
			}
		}

		registerConversationRoom(s, userID, conversations)

		// Latency check: socket.emit("ping", (res) => ...)
		s.On("ping", func(e *socketio.Event) {
			if e.HasAck() {
				_ = e.Ack("pong")
			}
		})
		s.OnDisconnect(func(reason string) {
			if userID != "" {
				DeleteSocketId(s.ID(), userID)
				if socketCount(userID) == 0 {
					emitPresence(io, userID, false)
				}
			}
			log.Printf("socket disconnected: id=%s user=%s reason=%s", s.ID(), userID, reason)
		})
	})
}
