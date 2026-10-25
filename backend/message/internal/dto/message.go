package dto

import (
	models "message/internal/model"
	"time"
)

type CreateMessageDto struct {
	ConversationId string   `json:"conversationId" binding:"required,uuid"`
	Content        string   `json:"content" binding:"max=5000"`
	Images         []string `json:"images" binding:"omitempty,max=10,dive,url"`
	ClientId       string   `json:"clientId" binding:"omitempty,max=64"`
}

type UpdateMessageDto struct {
	Content string `json:"content" binding:"required,max=5000"`
}

// GetMessagesDto paginates newest-first. Pass the created_at of the oldest
// message already loaded as Before to fetch the previous page.
type GetMessagesDto struct {
	ConversationId string     `form:"conversationId" binding:"required,uuid"`
	Before         *time.Time `form:"before" time_format:"2006-01-02T15:04:05Z07:00" binding:"omitempty"`
	Limit          int        `form:"limit" binding:"omitempty,min=1,max=100"`
}

// MessageEvent is published to message.exchange for realtime consumers.
// MemberIds lets the consumer fan out to user:<id> rooms without another lookup.
type MessageEvent struct {
	Message   *models.Message `json:"message"`
	MemberIds []string        `json:"memberIds"`
}
