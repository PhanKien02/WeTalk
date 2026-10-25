package main

import (
	"context"
	"log"
	"socket/config"
	"socket/internal/client"
	"socket/internal/events"
	"socket/internal/middleware"
	"socket/internal/socketio"
	"socket/rabbitmq"
	"socket/redis"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	router := gin.Default()
	ctx := context.Background()
	rabbitMQ, err := rabbitmq.NewRabbitMQService()
	if err != nil {
		log.Fatal(err)
	}
	defer rabbitMQ.Close()
	redis.ConectRedis(ctx)
	if err := events.ClearSocketIds(ctx); err != nil {
		log.Fatalf("failed to clear stale socket ids: %v", err)
	}
	router.Use(middleware.CORSMiddleware())
	io := socketio.NewServer(socketio.Options{})
	io.Use(middleware.SocketAuth(config.AppConfig.JWT_SECRET))

	events.Register(io, client.NewConversationClient(config.AppConfig.ConversationServiceURL))
	if err := events.ConsumeEvents(ctx, rabbitMQ, io); err != nil {
		log.Fatalf("failed to consume events: %v", err)
	}

	router.GET("/socket.io/", gin.WrapH(io))

	router.Run(":" + config.AppConfig.Port)
}
