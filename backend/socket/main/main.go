package main

import (
	"context"
	"log"
	"net/http"
	"socket/config"
	"socket/config/redis"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	// Allow all origins for development; restrict this in production.
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()
	
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}
		log.Printf("Received: %s", message)

		if err := conn.WriteMessage(messageType, message); err != nil {
			log.Printf("Write error: %v", err)
			break
		}
	}
}
func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	router := gin.Default()
	ctx := context.Background()

	redis.ConectRedis(ctx)
	router.GET("/", handleWebSocket)

	router.Run(":" + config.AppConfig.Port)
}
