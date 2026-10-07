package rabbitmq

import (
	"context"
	"encoding/json"
	"wetalk/config"
	logger "wetalk/pkg"

	"github.com/rabbitmq/amqp091-go"
)

type rabbitMQService struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
	logger  *logger.Logger
}

func NewRabbitMQService() (RabbitMQService, error) {
	logger := logger.New("Info")
	conn, err := amqp091.Dial(config.AppConfig.RaBBIT_MQ_URL)
	if err != nil {
		logger.Error("failed to connect to RabbitMQ")
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		logger.Error("failed to open channel")
		return nil, err
	}

	return &rabbitMQService{
		conn:    conn,
		channel: ch,
		logger:  logger,
	}, nil
}

func (r *rabbitMQService) Publish(ctx context.Context, queue string, message any) error {
	_, err := r.channel.QueueDeclare(queue, true, false, false, false, nil)
	if err != nil {
		r.logger.Error("failed to declare queue")
		return err
	}

	body, err := json.Marshal(message)
	if err != nil {
		r.logger.Error("failed to parse message")
		return err
	}

	err = r.channel.PublishWithContext(ctx, "", queue, false, false, amqp091.Publishing{
		ContentType: "text/plain",
		Body:        []byte(body),
	})

	if err != nil {
		r.logger.Error("failed to publish message")
		return err
	}

	return nil
}

func (r *rabbitMQService) Consume(ctx context.Context, queue string, handler func([]byte) error) error {
	_, err := r.channel.QueueDeclare(queue, true, false, false, false, nil)
	if err != nil {
		r.logger.Error("failed to declare queue")
		return err
	}

	msgs, err := r.channel.Consume(queue, "", false, false, false, false, nil)
	if err != nil {
		r.logger.Error("failed to declare consume")
		return err
	}

	go func() {
		for {
			select {
			case msg, ok := <-msgs:
				if !ok {
					return
				}

				if err := handler(msg.Body); err != nil {
					msg.Nack(false, false)
				} else {
					msg.Ack(false)
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	return nil
}

func (r *rabbitMQService) Close() error {
	if r.channel != nil {
		if err := r.channel.Close(); err != nil {
			r.logger.Error("failed to close channel")
			return err
		}
	}

	if r.conn != nil {
		if err := r.conn.Close(); err != nil {
			r.logger.Error("failed to close connection")
			return err
		}
	}

	return nil
}
