package consumer

import (
	"context"
	"wetalk/rabbitmq"

	"gorm.io/gorm"
)

func StartConsumer(ctx context.Context, rabbitMQ rabbitmq.RabbitMQService, db *gorm.DB) error {
	if err := CreateUserConsumer(ctx, rabbitMQ, db); err != nil {
		return err
	}
	return nil
}
