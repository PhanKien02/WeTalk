package events

import (
	"context"
	"encoding/json"
	"log"

	"socket/internal/socketio"
	"socket/rabbitmq"
)

// messageEvent mirrors dto.MessageEvent in the message service. Message is kept
// raw so it reaches the browser unchanged.
type messageEvent struct {
	Message   json.RawMessage `json:"message"`
	MemberIds []string        `json:"memberIds"`
}

// messageRoutes maps each message.exchange routing key to its queue and to the
// event name emitted to the browser.
var messageRoutes = []struct {
	routingKey string
	queue      string
	event      string
}{
	{rabbitmq.RoutingKeyMessageCreated, rabbitmq.QueueMessageCreated, "message:created"},
	{rabbitmq.RoutingKeyMessageUpdated, rabbitmq.QueueMessageUpdated, "message:updated"},
	{rabbitmq.RoutingKeyMessageDeleted, rabbitmq.QueueMessageDeleted, "message:deleted"},
}

// ConsumeMessages forwards message events to the user:<id> room of every
// conversation member, so all of a member's tabs and devices receive them.
func ConsumeMessages(ctx context.Context, mq rabbitmq.RabbitMQService, io *socketio.Server) error {
	for _, route := range messageRoutes {
		event := route.event
		err := mq.Subscribe(ctx, rabbitmq.ExchangeMessage, route.queue, route.routingKey, func(body []byte) error {
			var payload messageEvent
			if err := json.Unmarshal(body, &payload); err != nil {
				// A malformed payload will never succeed; drop it instead of requeueing.
				log.Printf("invalid %s payload: %v", event, err)
				return nil
			}

			rooms := make([]string, 0, len(payload.MemberIds))
			for _, id := range payload.MemberIds {
				rooms = append(rooms, UserRoom(id))
			}
			if len(rooms) == 0 {
				return nil
			}
			return io.To(rooms...).Emit(event, payload.Message)
		})
		if err != nil {
			return err
		}
	}
	return nil
}
