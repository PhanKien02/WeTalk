package main

import (
	"log"
	"message/config"
	"message/db"
	"message/internal/client"
	handle "message/internal/handler"
	"message/internal/repository"
	"message/internal/services"
	"message/rabbitmq"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}

	database := db.ConnectDB()
	if database == nil {
		log.Fatal("failed to connect to database")
	}

	rabbitMQ, err := rabbitmq.NewRabbitMQService()
	if err != nil {
		log.Fatal(err)
	}
	defer rabbitMQ.Close()

	if err := rabbitMQ.InitBindings(); err != nil {
		log.Fatalf("failed to init rabbitmq bindings: %v", err)
	}

	repo := repository.NewMessageRepository(database)
	conversations := client.NewConversationClient(config.AppConfig.ConversationServiceURL)
	service := services.NewMessageService(repo, conversations, rabbitMQ)
	handler := handle.NewMessageHandle(service)

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := router.Group("/api/v1/messages")
	{
		api.GET("", handler.FindAll)
		api.POST("", handler.CreateMessage)
		api.GET("/reads", handler.FindReads)
		api.POST("/read", handler.MarkRead)
		api.GET("/unread", handler.CountUnread)
		api.PUT("/:id", handler.UpdateMessage)
		api.DELETE("/:id", handler.DeleteMessage)
	}

	log.Println("Starting server on port", config.AppConfig.Port)
	if err := router.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal(err)
	}
}
