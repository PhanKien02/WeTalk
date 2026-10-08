package main

import (
	"log"
	"wetalk/config"
	"wetalk/db"
	"wetalk/internal/router"
	"wetalk/rabbitmq"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	rabbitMQ, err := rabbitmq.NewRabbitMQService()
	if err != nil {
		log.Fatal(err)
	}
	defer rabbitMQ.Close()

	r := gin.Default()
	db := db.ConnectDB()

	router.SetupRoutes(r, db, rabbitMQ)
	r.Run(":" + config.AppConfig.Port)
}
