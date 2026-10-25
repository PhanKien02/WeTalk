package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	MessageTypeText  = "text"
	MessageTypeImage = "image"
)

type Message struct {
	Id             uuid.UUID      `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ConversationId uuid.UUID      `gorm:"type:uuid;not null;index:idx_messages_conversation_created,priority:1" json:"conversationId"`
	SenderId       uuid.UUID      `gorm:"type:uuid;not null;index" json:"senderId"`
	Type           string         `gorm:"not null;default:'text'" json:"type"`
	Content        string         `gorm:"type:text;not null;default:''" json:"content"`
	Images         []string       `gorm:"serializer:json" json:"images"`
	IsEdited       bool           `gorm:"not null;default:false" json:"isEdited"`
	CreatedAt      time.Time      `json:"created_at" gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index:idx_messages_conversation_created,priority:2"`
	UpdatedAt      time.Time      `json:"updated_at" gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// ClientId is the sender's temporary id, echoed back (not stored) so the
	// client can match its optimistic message with the response and the socket event.
	ClientId string `gorm:"-" json:"clientId,omitempty"`
}
