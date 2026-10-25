package rabbitmq

import "context"

type RabbitMQService interface {
	Publish(ctx context.Context, queue string, message any) error
	SetupBindings(bindings []QueueBinding) error
	InitBindings() error
	BindQueue(queue, routingKey, exchange string) error
	Consume(ctx context.Context, queue string, handler func([]byte) error) error
	Subscribe(ctx context.Context, exchange, queue, routingKey string, handler func([]byte) error) error
	Close() error
}
