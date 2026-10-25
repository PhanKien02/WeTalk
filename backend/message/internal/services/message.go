package services

import (
	"context"
	"errors"
	"message/internal/client"
	"message/internal/dto"
	models "message/internal/model"
	repo "message/internal/repository"
	logger "message/pkg"
	"message/rabbitmq"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	defaultLimit = 30
)

var (
	ErrNotFound     = errors.New("message not found")
	ErrForbidden    = errors.New("you are not allowed to access this message")
	ErrEmptyMessage = errors.New("message must have content or images")
)

type MessageService interface {
	Create(ctx context.Context, userId string, body *dto.CreateMessageDto) (*models.Message, error)
	Update(ctx context.Context, userId, id string, body *dto.UpdateMessageDto) (*models.Message, error)
	Delete(ctx context.Context, userId, id string) error
	FindAll(ctx context.Context, userId string, query dto.GetMessagesDto) ([]models.Message, error)
}

type messageService struct {
	repo          repo.MessageRepository
	conversations client.ConversationClient
	rabbitmq      rabbitmq.RabbitMQService
	logger        *logger.Logger
}

func NewMessageService(repo repo.MessageRepository, conversations client.ConversationClient, rabbitmq rabbitmq.RabbitMQService) MessageService {
	return &messageService{
		repo:          repo,
		conversations: conversations,
		rabbitmq:      rabbitmq,
		logger:        logger.New("info"),
	}
}

// memberConversation loads the conversation and checks that userId belongs to it.
func (s *messageService) memberConversation(ctx context.Context, conversationId, userId string) (*client.Conversation, error) {
	conversation, err := s.conversations.FindById(ctx, conversationId, userId)
	if err != nil {
		if errors.Is(err, client.ErrConversationNotFound) {
			return nil, ErrForbidden
		}
		return nil, err
	}
	if !conversation.HasMember(userId) {
		return nil, ErrForbidden
	}
	return conversation, nil
}

// publish is best-effort: the message is already persisted, so a broker failure
// only delays realtime delivery and must not fail the request.
func (s *messageService) publish(ctx context.Context, routingKey string, message *models.Message, memberIds []string) {
	event := dto.MessageEvent{Message: message, MemberIds: memberIds}
	if err := s.rabbitmq.Publish(ctx, rabbitmq.ExchangeMessage, routingKey, event); err != nil {
		s.logger.Error("failed to publish %s for message %s: %v", routingKey, message.Id, err)
	}
}

func (s *messageService) Create(ctx context.Context, userId string, body *dto.CreateMessageDto) (*models.Message, error) {
	content := strings.TrimSpace(body.Content)
	if content == "" && len(body.Images) == 0 {
		return nil, ErrEmptyMessage
	}

	senderId, err := uuid.Parse(userId)
	if err != nil {
		return nil, ErrForbidden
	}

	conversation, err := s.memberConversation(ctx, body.ConversationId, userId)
	if err != nil {
		return nil, err
	}

	images := body.Images
	if images == nil {
		images = []string{}
	}

	messageType := models.MessageTypeText
	if len(images) > 0 {
		messageType = models.MessageTypeImage
	}

	message := models.Message{
		ConversationId: uuid.MustParse(body.ConversationId),
		SenderId:       senderId,
		Type:           messageType,
		Content:        content,
		Images:         images,
	}

	if err := s.repo.Create(&message); err != nil {
		return nil, err
	}

	s.publish(ctx, rabbitmq.RoutingKeyMessageCreated, &message, conversation.MemberIds)
	return &message, nil
}

// findOwned loads a message and checks that userId is its sender.
func (s *messageService) findOwned(userId, id string) (*models.Message, error) {
	if _, err := uuid.Parse(id); err != nil {
		return nil, ErrNotFound
	}
	message, err := s.repo.FindById(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if message.SenderId.String() != userId {
		return nil, ErrForbidden
	}
	return message, nil
}

func (s *messageService) Update(ctx context.Context, userId, id string, body *dto.UpdateMessageDto) (*models.Message, error) {
	message, err := s.findOwned(userId, id)
	if err != nil {
		return nil, err
	}

	content := strings.TrimSpace(body.Content)
	if content == "" && len(message.Images) == 0 {
		return nil, ErrEmptyMessage
	}

	conversation, err := s.memberConversation(ctx, message.ConversationId.String(), userId)
	if err != nil {
		return nil, err
	}

	message.Content = content
	message.IsEdited = true
	message.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(message); err != nil {
		return nil, err
	}

	s.publish(ctx, rabbitmq.RoutingKeyMessageUpdated, message, conversation.MemberIds)
	return message, nil
}

func (s *messageService) Delete(ctx context.Context, userId, id string) error {
	message, err := s.findOwned(userId, id)
	if err != nil {
		return err
	}

	conversation, err := s.memberConversation(ctx, message.ConversationId.String(), userId)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id); err != nil {
		return err
	}

	s.publish(ctx, rabbitmq.RoutingKeyMessageDeleted, message, conversation.MemberIds)
	return nil
}

func (s *messageService) FindAll(ctx context.Context, userId string, query dto.GetMessagesDto) ([]models.Message, error) {
	if _, err := s.memberConversation(ctx, query.ConversationId, userId); err != nil {
		return nil, err
	}

	if query.Limit <= 0 {
		query.Limit = defaultLimit
	}
	return s.repo.FindAll(query)
}
