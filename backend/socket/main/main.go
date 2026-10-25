package main

import (
	"context"
	"log"
	"socket/config"
	"socket/internal/events"
	"socket/internal/middleware"
	"socket/internal/socketio"
	"socket/redis"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	router := gin.Default()
	ctx := context.Background()

	redis.ConectRedis(ctx)
	router.Use(middleware.CORSMiddleware())
	io := socketio.NewServer(socketio.Options{})
	io.Use(middleware.SocketAuth(config.AppConfig.JWT_SECRET))

	events.Register(io)

	router.GET("/socket.io/", gin.WrapH(io))

	router.Run(":" + config.AppConfig.Port)
}
