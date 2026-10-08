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
	conn, err := amqp091.Dial(config.AppConfig.RabbitMQURL)
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


func (r *rabbitMQService) BindQueue(queue, routingKey, exchange string) error {
	return r.channel.QueueBind(queue, routingKey, exchange, false, nil)
}

func (r *rabbitMQService) SetupBindings(bindings []QueueBinding) error {
	for _, b := range bindings {
		if err := r.channel.ExchangeDeclare(b.Exchange, "topic", true, false, false, false, nil); err != nil {
			r.logger.Error("failed to declare exchange %s: %v", b.Exchange, err)
			return err
		}
		if _, err := r.channel.QueueDeclare(b.Queue, true, false, false, false, nil); err != nil {
			r.logger.Error("failed to declare queue %s: %v", b.Queue, err)
			return err
		}
		if err := r.channel.QueueBind(b.Queue, b.RoutingKey, b.Exchange, false, nil); err != nil {
			r.logger.Error("failed to bind queue %s to exchange %s with key %s: %v", b.Queue, b.Exchange, b.RoutingKey, err)
			return err
		}
		r.logger.Info("Bound queue [%s] to exchange [%s] with routing key [%s]", b.Queue, b.Exchange, b.RoutingKey)
	}
	return nil
}

func (r *rabbitMQService) InitBindings() error {
	return r.SetupBindings(DefaultBindings)
}

func (r *rabbitMQService) Consume(ctx context.Context, queue string, handler func([]byte) error) error {
	if err := r.channel.Qos(1, 0, false); err != nil {
		r.logger.Error("failed to set qos: %v", err)
		return err
	}
	msgs, err := r.channel.Consume(queue, "", false, false, false, false, nil)
	if err != nil {
		r.logger.Error("failed to start consuming queue %s: %v", queue, err)
		return err
	}

	r.logger.Info("Started consuming from queue [%s]", queue)

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

func (r *rabbitMQService) Subscribe(ctx context.Context, exchange, queue, routingKey string, handler func([]byte) error) error {
	if err := r.SetupBindings([]QueueBinding{{Exchange: exchange, Queue: queue, RoutingKey: routingKey}}); err != nil {
		return err
	}
	return r.Consume(ctx, queue, handler)
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
