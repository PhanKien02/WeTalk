package main

import (
	"conversation/config"
	"conversation/db"
	handle "conversation/internal/handler"
	"conversation/internal/repository"
	"conversation/internal/services"
	"log"

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

	repo := repository.NewConversationRepository(database)
	service := services.NewConversationService(repo)
	handler := handle.NewConversationHandle(service)

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := router.Group("/api/v1/conversations")
	{
		api.GET("", handler.FindAll)
		api.GET("/:id", handler.FindById)
		api.POST("", handler.CreateConversation)
		api.PUT("/:id", handler.UpdateConversation)
		api.DELETE("/:id", handler.DeleteConversation)
	}

	log.Println("Starting server on port", config.AppConfig.Port)
	if err := router.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal(err)
	}
}
