package rabbitmq

// Exchanges
const (
	ExchangeUser = "user.exchange"
)

// Queues
const (
	QueueAuthActive = "auth-service.auth-active"
)

// Routing Keys
const (
	RoutingKeyAuthActive = "user.active"
)

// QueueBinding represents a binding rule between exchange and queue
type QueueBinding struct {
	Exchange   string
	Queue      string
	RoutingKey string
}

// DefaultBindings defines the list of all queues and routing keys to bind on startup
var DefaultBindings = []QueueBinding{
	{Exchange: ExchangeUser, Queue: QueueAuthActive, RoutingKey: RoutingKeyAuthActive},
}
