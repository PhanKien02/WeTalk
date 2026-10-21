package main

import (
	"context"
	"log"
	"socket/config"
	"socket/config/redis"
	"socket/internal/middleware"
	ws "socket/internal/websocket"

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
	router.Use(middleware.AuthRequired(config.AppConfig.JWT_SECRET))
	router.GET("/ws", ws.NewHub().ServeWS)

	router.Run(":" + config.AppConfig.Port)
}
