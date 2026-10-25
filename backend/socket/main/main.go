package main

import (
	"context"
	"log"
	"socket/config"
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
	router.Use(middleware.CORSMiddleware())
	io := socketio.NewServer(socketio.Options{})
	io.Use(middleware.SocketAuth(config.AppConfig.JWT_SECRET))

	events.Register(io)
	if err := events.ConsumeMessages(ctx, rabbitMQ, io); err != nil {
		log.Fatalf("failed to consume message events: %v", err)
	}

	router.GET("/socket.io/", gin.WrapH(io))

	router.Run(":" + config.AppConfig.Port)
}
