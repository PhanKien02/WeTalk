package rabbitmq

import (
	"context"
	"encoding/json"
	"wetalk/config"

	"github.com/rabbitmq/amqp091-go"
)

type Publisher interface {
	Publish(ctx context.Context, exchange, routingKey string, message any) error
	Close() error
}

type service struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
}

func NewRabbitMQService() (Publisher, error) {
	conn, err := amqp091.Dial(config.AppConfig.RabbitMQURL)
	if err != nil {
		return nil, err
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}

	return &service{conn: conn, channel: channel}, nil
}

func (r *service) Publish(ctx context.Context, exchange, routingKey string, message any) error {
	if err := r.channel.ExchangeDeclare(exchange, "topic", true, false, false, false, nil); err != nil {
		return err
	}

	body, err := json.Marshal(message)
	if err != nil {
		return err
	}

	return r.channel.PublishWithContext(ctx, exchange, routingKey, false, false, amqp091.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp091.Persistent,
		Body:         body,
	})
}

func (r *service) Close() error {
	if r.channel != nil && !r.channel.IsClosed() {
		if err := r.channel.Close(); err != nil {
			return err
		}
	}
	if r.conn != nil && !r.conn.IsClosed() {
		return r.conn.Close()
	}
	return nil
}
