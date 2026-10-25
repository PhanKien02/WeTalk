package events

import (
	"context"
	"log"

	"socket/internal/socketio"
	"socket/redis"

	goredis "github.com/redis/go-redis/v9"
)

// PresenceRoom holds the sockets that want to know when userID goes online or offline.
func PresenceRoom(userID string) string {
	return "presence:" + userID
}

type presencePayload struct {
	UserId string `json:"userId"`
	Online bool   `json:"online"`
}

func socketCount(userId string) int64 {
	ctx := context.Background()
	n, err := redis.GetInstance(ctx).SCard(ctx, userSocketsKey(userId)).Result()
	if err != nil {
		log.Printf("count sockets failed: user=%s err=%v", userId, err)
	}
	return n
}

// OnlineUserIds returns the users in userIds that have at least one socket.
func OnlineUserIds(userIds []string) []string {
	ctx := context.Background()
	pipe := redis.GetInstance(ctx).Pipeline()
	counts := make([]*goredis.IntCmd, len(userIds))
	for i, id := range userIds {
		counts[i] = pipe.SCard(ctx, userSocketsKey(id))
	}
	if _, err := pipe.Exec(ctx); err != nil {
		log.Printf("count sockets failed: err=%v", err)
	}

	online := []string{}
	for i, count := range counts {
		if count.Val() > 0 {
			online = append(online, userIds[i])
		}
	}
	return online
}

func emitPresence(io *socketio.Server, userId string, online bool) {
	_ = io.To(PresenceRoom(userId)).Emit(EventPresence, presencePayload{UserId: userId, Online: online})
}

// ClearSocketIds drops every socket:user:* set. Sockets do not survive a
// restart, so sets left by a crash would otherwise keep users online forever.
// This assumes a single socket instance.
func ClearSocketIds(ctx context.Context) error {
	rdb := redis.GetInstance(ctx)
	iter := rdb.Scan(ctx, 0, userSocketsKey("*"), 100).Iterator()
	for iter.Next(ctx) {
		if err := rdb.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}
