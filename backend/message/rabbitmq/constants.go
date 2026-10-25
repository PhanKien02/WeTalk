package rabbitmq

// Exchanges
const (
	ExchangeMessage = "message.exchange"
)

// Routing Keys
const (
	RoutingKeyMessageCreated = "message.created"
	RoutingKeyMessageUpdated = "message.updated"
	RoutingKeyMessageDeleted = "message.deleted"
	RoutingKeyMessageRead    = "message.read"
)

// QueueBinding represents a binding rule between exchange and queue
type QueueBinding struct {
	Exchange   string
	Queue      string
	RoutingKey string
}

// DefaultBindings defines the list of all queues and routing keys to bind on startup.
// The message service only publishes, so it binds nothing; consumers (e.g. socket)
// declare their own queues on message.exchange.
var DefaultBindings = []QueueBinding{}
