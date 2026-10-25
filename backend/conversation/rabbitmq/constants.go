package rabbitmq

// Exchanges
const (
	ExchangeUser    = "user.exchange"
	ExchangeMessage = "message.exchange"
)

// Queues
const (
	QueueUserCreated = "user-service.user-created"
	QueueUser        = QueueUserCreated

	QueueMessageCreated = "conversation-service.message-created"
)

// Routing Keys
const (
	RoutingKeyUserCreated = "user.created"

	RoutingKeyMessageCreated = "message.created"
)

// QueueBinding represents a binding rule between exchange and queue
type QueueBinding struct {
	Exchange   string
	Queue      string
	RoutingKey string
}

// DefaultBindings defines the list of all queues and routing keys to bind on startup
var DefaultBindings = []QueueBinding{
	{
		Exchange:   ExchangeUser,
		Queue:      QueueUserCreated,
		RoutingKey: RoutingKeyUserCreated,
	},
}
