package services

import (
	"context"
	"conversation/internal/dto"
	models "conversation/internal/model"
	repo "conversation/internal/repository"
	logger "conversation/pkg"
	"conversation/rabbitmq"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrNotFound  = errors.New("conversation not found")
	ErrForbidden = errors.New("you are not a member of this conversation")
)

type ConversationService interface {
	Create(ctx context.Context, body *dto.CreateConversationDto) (*models.Conversation, error)
	Update(ctx context.Context, userId, id string, conversation *models.Conversation) (*models.Conversation, error)
	Delete(ctx context.Context, userId, id string) error
	FindById(id string) (*models.Conversation, error)
	FindAll(query dto.GetConversationDto, userId string) ([]models.Conversation, error)
}

type conversationService struct {
	repo     repo.ConversationRepository
	rabbitmq rabbitmq.RabbitMQService
	logger   *logger.Logger
}

func NewConversationService(repo repo.ConversationRepository, rabbitmq rabbitmq.RabbitMQService) ConversationService {
	return &conversationService{repo: repo, rabbitmq: rabbitmq, logger: logger.New("info")}
}

func memberIdStrings(ids models.UUIDArray) []string {
	res := make([]string, 0, len(ids))
	for _, id := range ids {
		res = append(res, id.String())
	}
	return res
}

func hasMember(conversation *models.Conversation, userId string) bool {
	for _, id := range conversation.MemberIds {
		if id.String() == userId {
			return true
		}
	}
	return false
}

// publish is best-effort: the change is already saved, so a broker failure only
// delays realtime updates and must not fail the request.
func (s *conversationService) publish(ctx context.Context, routingKey string, event dto.ConversationEvent) {
	if err := s.rabbitmq.Publish(ctx, rabbitmq.ExchangeConversation, routingKey, event); err != nil {
		s.logger.Error("failed to publish %s for conversation %s: %v", routingKey, event.Conversation.Id, err)
	}
}

// findMember loads a conversation and checks that userId belongs to it.
func (s *conversationService) findMember(userId, id string) (*models.Conversation, error) {
	if _, err := uuid.Parse(id); err != nil {
		return nil, ErrNotFound
	}
	conversation, err := s.repo.FindById(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if !hasMember(conversation, userId) {
		return nil, ErrForbidden
	}
	return conversation, nil
}

func (s *conversationService) Create(ctx context.Context, body *dto.CreateConversationDto) (*models.Conversation, error) {
	memberIds := models.UUIDArray{}
	for _, memberId := range body.MemberIds {
		m, err := uuid.Parse(memberId)
		if err == nil {
			memberIds = append(memberIds, m)
		}
	}

	isGroup := false
	if body.IsGroup != nil {
		isGroup = *body.IsGroup
	}

	var conversation models.Conversation = models.Conversation{
		IsGroup:     isGroup,
		GroupName:   body.GroupName,
		GroupAvatar: body.GroupAvatar,
		Description: body.Description,
		MemberCount: len(memberIds),
		Tags:        body.Tags,
		MemberIds:   memberIds,
	}

	if err := s.repo.Create(&conversation); err != nil {
		return nil, err
	}

	s.publish(ctx, rabbitmq.RoutingKeyConversationCreated, dto.ConversationEvent{
		Conversation: &conversation,
		MemberIds:    memberIdStrings(conversation.MemberIds),
	})
	return &conversation, nil
}

func (s *conversationService) Update(ctx context.Context, userId, id string, conversation *models.Conversation) (*models.Conversation, error) {
	before, err := s.findMember(userId, id)
	if err != nil {
		return nil, err
	}

	if conversation.MemberIds != nil {
		conversation.MemberCount = len(conversation.MemberIds)
	}
	if err := s.repo.Update(id, conversation); err != nil {
		return nil, err
	}

	after, err := s.repo.FindById(id)
	if err != nil {
		return nil, err
	}

	var removed []string
	for _, memberId := range before.MemberIds {
		if !hasMember(after, memberId.String()) {
			removed = append(removed, memberId.String())
		}
	}

	s.publish(ctx, rabbitmq.RoutingKeyConversationUpdated, dto.ConversationEvent{
		Conversation:     after,
		MemberIds:        memberIdStrings(after.MemberIds),
		RemovedMemberIds: removed,
	})
	return after, nil
}

func (s *conversationService) Delete(ctx context.Context, userId, id string) error {
	conversation, err := s.findMember(userId, id)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id); err != nil {
		return err
	}

	s.publish(ctx, rabbitmq.RoutingKeyConversationDeleted, dto.ConversationEvent{
		Conversation: conversation,
		MemberIds:    memberIdStrings(conversation.MemberIds),
	})
	return nil
}

func (s *conversationService) FindById(id string) (*models.Conversation, error) {
	return s.repo.FindById(id)
}

func (s *conversationService) FindAll(query dto.GetConversationDto, userId string) ([]models.Conversation, error) {
	return s.repo.FindAll(query, userId)
}
