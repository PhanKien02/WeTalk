package main

import (
	"context"
	"log"
	"wetalk/config"
	"wetalk/db"
	"wetalk/internal/router"
	"wetalk/rabbitmq"
	"wetalk/rabbitmq/consumer"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	ctx := context.Background()
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	db := db.ConnectDB()
	rabbitMQ, err := rabbitmq.NewRabbitMQService()
	if err != nil {
		log.Fatal(err)
	}
	defer rabbitMQ.Close()

	// Khởi tạo và bind tất cả queue, routing key ngay khi start project
	if err := rabbitMQ.InitBindings(); err != nil {
		log.Fatalf("failed to init rabbitmq bindings: %v", err)
	}
	if err := consumer.StartConsumer(ctx, rabbitMQ, db); err != nil {
		log.Fatalf("failed to start consumer: %v", err)
	}

	router.SetupRoutes(r, db, rabbitMQ)
	r.Run(":" + config.AppConfig.Port)
}
