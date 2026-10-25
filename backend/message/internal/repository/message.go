package repository

import (
	"message/internal/dto"
	models "message/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MessageRepository interface {
	Create(message *models.Message) error
	Update(message *models.Message) error
	Delete(id string) error
	FindById(id string) (*models.Message, error)
	FindAll(query dto.GetMessagesDto) ([]models.Message, error)
	UpsertRead(read *models.MessageRead) (bool, error)
	FindReads(conversationId string) ([]models.MessageRead, error)
	CountUnread(userId string, conversationIds []string) ([]dto.UnreadCount, error)
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

// UpsertRead only moves the read position forward. It reports whether it changed.
func (r *messageRepository) UpsertRead(read *models.MessageRead) (bool, error) {
	tx := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "conversation_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"last_read_message_id", "last_read_at", "updated_at"}),
		Where: clause.Where{Exprs: []clause.Expression{
			clause.Expr{SQL: "excluded.last_read_at > message_reads.last_read_at"},
		}},
	}).Create(read)
	return tx.RowsAffected > 0, tx.Error
}

func (r *messageRepository) FindReads(conversationId string) ([]models.MessageRead, error) {
	var reads []models.MessageRead
	err := r.db.Where("conversation_id = ?", conversationId).Find(&reads).Error
	return reads, err
}

// CountUnread counts messages from other users newer than the user's read
// position. A conversation the user never read counts all of them.
func (r *messageRepository) CountUnread(userId string, conversationIds []string) ([]dto.UnreadCount, error) {
	counts := []dto.UnreadCount{}
	if len(conversationIds) == 0 {
		return counts, nil
	}
	err := r.db.Table("messages AS m").
		Select("m.conversation_id AS conversation_id, COUNT(*) AS count").
		Joins("LEFT JOIN message_reads AS r ON r.conversation_id = m.conversation_id AND r.user_id = ?", userId).
		Where("m.conversation_id IN ?", conversationIds).
		Where("m.sender_id <> ?", userId).
		Where("m.deleted_at IS NULL").
		Where("r.last_read_at IS NULL OR m.created_at > r.last_read_at").
		Group("m.conversation_id").
		Scan(&counts).Error
	return counts, err
}
