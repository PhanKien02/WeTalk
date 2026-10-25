package redis

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConectRedis(ctx context.Context) *redis.Client {

	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal(err)
	}
	RedisClient = rdb
	return rdb
}
func GetInstance(ctx context.Context) *redis.Client {
	if RedisClient == nil {
		RedisClient = ConectRedis(ctx)
	}

	return RedisClient
}
