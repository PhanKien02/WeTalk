package consumer

import (
	"context"
	"conversation/internal/repository"
	"conversation/rabbitmq"
	"encoding/json"
	"log"
	"strings"
	"time"
)

type messageCreatedEvent struct {
	Message struct {
		ConversationId string    `json:"conversationId"`
		Content        string    `json:"content"`
		Images         []string  `json:"images"`
		CreatedAt      time.Time `json:"created_at"`
	} `json:"message"`
}

// StartConsumer keeps each conversation's lastMessage preview in sync with the
// message service.
func StartConsumer(ctx context.Context, mq rabbitmq.RabbitMQService, repo repository.ConversationRepository) error {
	return mq.Subscribe(ctx, rabbitmq.ExchangeMessage, rabbitmq.QueueMessageCreated, rabbitmq.RoutingKeyMessageCreated, func(body []byte) error {
		var event messageCreatedEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("invalid message.created payload: %v", err)
			return nil
		}

		preview := strings.TrimSpace(event.Message.Content)
		if preview == "" && len(event.Message.Images) > 0 {
			preview = "[Hình ảnh]"
		}

		at := event.Message.CreatedAt
		if at.IsZero() {
			at = time.Now()
		}
		return repo.UpdateLastMessage(event.Message.ConversationId, preview, at)
	})
}
