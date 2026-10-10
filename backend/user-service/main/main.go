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
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	rabbitMQ, err := rabbitmq.NewRabbitMQService()
	if err != nil {
		log.Fatal(err)
	}
	defer rabbitMQ.Close()

	// Khởi tạo và bind tất cả queue, routing key ngay khi start project
	if err := rabbitMQ.InitBindings(); err != nil {
		log.Fatalf("failed to init rabbitmq bindings: %v", err)
	}

	r := gin.Default()

	db := db.ConnectDB()
	ctx := context.Background()
	if err := consumer.StartConsumer(ctx, rabbitMQ, db); err != nil {
		log.Fatalf("failed to start consumer: %v", err)
	}
	router.SetupRoutes(r, db)
	if err := r.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal(err)
	}
}
