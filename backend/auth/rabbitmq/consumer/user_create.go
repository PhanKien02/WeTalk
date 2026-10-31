package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"wetalk/internal/repository"
	"wetalk/internal/service"
	"wetalk/rabbitmq"

	"gorm.io/gorm"
)

type UserCreated struct {
	ID        string `json:"id"`
	IsSuccess bool   `json:"is_success"`
	Message   string `json:"message"`
}

func CreateUserConsumer(ctx context.Context, rabbitMQ rabbitmq.RabbitMQService, db *gorm.DB) error {
	s := service.NewAuthService(repository.NewAuthRepository(db), rabbitMQ)

	err := rabbitMQ.Consume(ctx, rabbitmq.QueueAuthActive, func(body []byte) error {
		var event UserCreated
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error unmarshalling user created event: %v", err)
			return err
		}
		fmt.Println("Received user created event:", event)
		if !event.IsSuccess {
			s.Delete(ctx, event.ID)
			return nil
		} else {
			s.Activate(ctx, event.ID)
			return nil
		}
	})

	if err != nil {
		log.Printf("Failed to subscribe to RabbitMQ: %v", err)
		return err
	}

	return nil
}
