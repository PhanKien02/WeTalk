package events

import (
	"context"
	"encoding/json"
	"log"

	"socket/internal/socketio"
	"socket/rabbitmq"
)

// fanoutEvent is the shape every publisher uses: the recipients plus one
// payload field. Payloads stay raw so they reach the browser unchanged.
type fanoutEvent struct {
	MemberIds        []string        `json:"memberIds"`
	RemovedMemberIds []string        `json:"removedMemberIds"`
	Message          json.RawMessage `json:"message"`
	Read             json.RawMessage `json:"read"`
	Conversation     json.RawMessage `json:"conversation"`
}

func messagePayload(e *fanoutEvent) json.RawMessage      { return e.Message }
func readPayload(e *fanoutEvent) json.RawMessage         { return e.Read }
func conversationPayload(e *fanoutEvent) json.RawMessage { return e.Conversation }

// fanoutRoutes maps each RabbitMQ routing key to its queue and to the event
// emitted to the browser.
var fanoutRoutes = []struct {
	exchange   string
	routingKey string
	queue      string
	event      string
	payload    func(*fanoutEvent) json.RawMessage
}{
	{rabbitmq.ExchangeMessage, rabbitmq.RoutingKeyMessageCreated, rabbitmq.QueueMessageCreated, EventMessageCreated, messagePayload},
	{rabbitmq.ExchangeMessage, rabbitmq.RoutingKeyMessageUpdated, rabbitmq.QueueMessageUpdated, EventMessageUpdated, messagePayload},
	{rabbitmq.ExchangeMessage, rabbitmq.RoutingKeyMessageDeleted, rabbitmq.QueueMessageDeleted, EventMessageDeleted, messagePayload},
	{rabbitmq.ExchangeMessage, rabbitmq.RoutingKeyMessageRead, rabbitmq.QueueMessageRead, EventMessageRead, readPayload},
	{rabbitmq.ExchangeConversation, rabbitmq.RoutingKeyConversationCreated, rabbitmq.QueueConversationCreated, EventConversationCreated, conversationPayload},
	{rabbitmq.ExchangeConversation, rabbitmq.RoutingKeyConversationUpdated, rabbitmq.QueueConversationUpdated, EventConversationUpdated, conversationPayload},
	{rabbitmq.ExchangeConversation, rabbitmq.RoutingKeyConversationDeleted, rabbitmq.QueueConversationDeleted, EventConversationDeleted, conversationPayload},
}

func userRooms(userIds []string) []string {
	rooms := make([]string, 0, len(userIds))
	for _, id := range userIds {
		rooms = append(rooms, UserRoom(id))
	}
	return rooms
}

// ConsumeEvents forwards backend events to the user:<id> room of every
// recipient, so all of a user's tabs and devices receive them.
func ConsumeEvents(ctx context.Context, mq rabbitmq.RabbitMQService, io *socketio.Server) error {
	for _, route := range fanoutRoutes {
		route := route
		err := mq.Subscribe(ctx, route.exchange, route.queue, route.routingKey, func(body []byte) error {
			var event fanoutEvent
			if err := json.Unmarshal(body, &event); err != nil {
				// A malformed payload will never succeed; drop it instead of requeueing.
				log.Printf("invalid %s payload: %v", route.routingKey, err)
				return nil
			}

			payload := route.payload(&event)
			if rooms := userRooms(event.MemberIds); len(rooms) > 0 {
				if err := io.To(rooms...).Emit(route.event, payload); err != nil {
					return err
				}
			}
			// Members removed by an update lose the conversation, as if it were deleted.
			if rooms := userRooms(event.RemovedMemberIds); len(rooms) > 0 {
				return io.To(rooms...).Emit(EventConversationDeleted, payload)
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}
