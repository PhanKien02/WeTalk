package repository

import (
	"conversation/internal/dto"
	models "conversation/internal/model"

	"gorm.io/gorm"
)

type ConversationRepository interface {
	Create(conversation *models.Conversation) error
	Update(id string, conversation *models.Conversation) error
	Delete(id string) error
	FindById(id string) (*models.Conversation, error)
	FindAll(query dto.GetConversationDto, userId string) ([]models.Conversation, error)
}

type conversationRepository struct {
	db *gorm.DB
}

func NewConversationRepository(db *gorm.DB) ConversationRepository {
	return &conversationRepository{db: db}
}

func (r *conversationRepository) Create(conversation *models.Conversation) error {
	return r.db.Model(&models.Conversation{}).Create(conversation).Error
}

func (r *conversationRepository) Update(id string, conversation *models.Conversation) error {
	return r.db.Model(&models.Conversation{}).Where("id = ?", id).Updates(conversation).Error
}

func (r *conversationRepository) Delete(id string) error {
	return r.db.Model(&models.Conversation{}).Where("id = ?", id).Delete(&models.Conversation{}).Error
}

func (r *conversationRepository) FindById(id string) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.db.Model(&models.Conversation{}).Where("id = ?", id).First(&conversation).Error
	return &conversation, err
}

func (r *conversationRepository) FindAll(query dto.GetConversationDto, userId string) ([]models.Conversation, error) {
	var conversations []models.Conversation
	tx := r.db.Model(&models.Conversation{})
	if query.TextSearch != "" {
		tx = tx.Where("group_name ILIKE ?", "%"+query.TextSearch+"%")
	}
	if userId != "" {
		tx = tx.Where("? = ANY(member_ids)", userId)
	}
	if query.Limit > 0 {
		tx = tx.Limit(query.Limit)
	}
	if query.Offset > 0 {
		tx = tx.Offset(query.Offset)
	}
	err := tx.Order("updated_at DESC").Find(&conversations).Error
	return conversations, err
}
