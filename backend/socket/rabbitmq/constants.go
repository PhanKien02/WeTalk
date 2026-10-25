package rabbitmq

// Exchanges
const (
	ExchangeUser = "user.exchange"
)

// Queues
const (
	QueueUserCreated = "user-service.user-created"
	QueueUser        = QueueUserCreated
)

// Routing Keys
const (
	RoutingKeyUserCreated = "user.created"
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
