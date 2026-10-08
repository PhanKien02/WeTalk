package consumer

import (
	"context"
	"encoding/json"
	"log"
	"wetalk/internal/models"
	"wetalk/internal/repository"
	"wetalk/internal/service"
	"wetalk/rabbitmq"

	"gorm.io/gorm"
)

type UserCreated struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func CreateUserConsumer(ctx context.Context, rabbitMQ rabbitmq.RabbitMQService, db *gorm.DB) error {
	s := service.NewUserService(repository.NewUserRepository(db))

	err := rabbitMQ.Consume(ctx, rabbitmq.QueueUser, func(body []byte) error {
		var event UserCreated
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error unmarshalling user created event: %v", err)
			return err
		}

		user := models.User{
			ID:    event.ID,
			Name:  event.Name,
			Email: event.Email,
			Phone: event.Phone,
		}

		if err := s.HandleUserCreatedEvent(ctx, &user); err != nil {
			log.Printf("Error creating user from event: %v", err)
			return err
		}

		log.Printf("User created from event successfully: %+v", user)
		return nil
	})

	if err != nil {
		log.Printf("Failed to subscribe to RabbitMQ: %v", err)
		return err
	}

	return nil
}
