package models

import (
	"time"

	"github.com/google/uuid"
)

// MessageRead is how far a user has read in a conversation. LastReadAt is the
// created_at of LastReadMessageId, so it can be compared with messages directly.
type MessageRead struct {
	ConversationId    uuid.UUID `gorm:"primaryKey;type:uuid" json:"conversationId"`
	UserId            uuid.UUID `gorm:"primaryKey;type:uuid" json:"userId"`
	LastReadMessageId uuid.UUID `gorm:"type:uuid;not null" json:"lastReadMessageId"`
	LastReadAt        time.Time `gorm:"type:timestamp;not null" json:"lastReadAt"`
	UpdatedAt         time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}
