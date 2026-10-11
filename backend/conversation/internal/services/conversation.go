package services

import (
	"conversation/internal/dto"
	models "conversation/internal/model"
	repo "conversation/internal/repository"

	"github.com/google/uuid"
)

type ConversationService interface {
	Create(body *dto.CreateConversationDto) (*models.Conversation, error)
	Update(id string, conversation *models.Conversation) error
	Delete(id string) error
	FindById(id string) (*models.Conversation, error)
	FindAll(query dto.GetConversationDto, userId string) ([]models.Conversation, error)
}

type conversationService struct {
	repo repo.ConversationRepository
}

func NewConversationService(repo repo.ConversationRepository) ConversationService {
	return &conversationService{repo: repo}
}

func (s *conversationService) Create(body *dto.CreateConversationDto) (*models.Conversation, error) {
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
		MemberCount: len(body.MemberIds),
		Tags:        body.Tags,
		MemberIds:   memberIds,
	}

	if err := s.repo.Create(&conversation); err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (s *conversationService) Update(id string, conversation *models.Conversation) error {
	return s.repo.Update(id, conversation)
}

func (s *conversationService) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *conversationService) FindById(id string) (*models.Conversation, error) {
	return s.repo.FindById(id)
}

func (s *conversationService) FindAll(query dto.GetConversationDto, userId string) ([]models.Conversation, error) {
	return s.repo.FindAll(query, userId)
}
