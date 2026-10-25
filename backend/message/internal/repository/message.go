package repository

import (
	"message/internal/dto"
	models "message/internal/model"

	"gorm.io/gorm"
)

type MessageRepository interface {
	Create(message *models.Message) error
	Update(message *models.Message) error
	Delete(id string) error
	FindById(id string) (*models.Message, error)
	FindAll(query dto.GetMessagesDto) ([]models.Message, error)
}

type messageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepository{db: db}
}

func (r *messageRepository) Create(message *models.Message) error {
	return r.db.Model(&models.Message{}).Create(message).Error
}

func (r *messageRepository) Update(message *models.Message) error {
	return r.db.Model(message).Select("content", "is_edited", "updated_at").Updates(message).Error
}

func (r *messageRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Message{}).Error
}

func (r *messageRepository) FindById(id string) (*models.Message, error) {
	var message models.Message
	err := r.db.Model(&models.Message{}).Where("id = ?", id).First(&message).Error
	return &message, err
}

func (r *messageRepository) FindAll(query dto.GetMessagesDto) ([]models.Message, error) {
	var messages []models.Message
	tx := r.db.Model(&models.Message{}).Where("conversation_id = ?", query.ConversationId)
	if query.Before != nil {
		tx = tx.Where("created_at < ?", *query.Before)
	}
	err := tx.Order("created_at DESC").Limit(query.Limit).Find(&messages).Error
	return messages, err
}
