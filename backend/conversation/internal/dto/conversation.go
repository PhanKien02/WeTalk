package dto

import models "conversation/internal/model"

type CreateConversationDto struct {
	IsGroup     *bool    `json:"isGroup" binding:"required"`
	GroupName   string   `json:"groupName" binding:"required"`
	GroupAvatar string   `json:"groupAvatar" binding:"required"`
	Description string   `json:"description" binding:"required"`
	Tags        []string `json:"tags" binding:"required"`
	MemberIds   []string `json:"memberIds" binding:"required"`
}

// ConversationEvent is published to conversation.exchange. MemberIds receive
// the event; RemovedMemberIds were members before an update and lost access.
type ConversationEvent struct {
	Conversation     *models.Conversation `json:"conversation"`
	MemberIds        []string             `json:"memberIds"`
	RemovedMemberIds []string             `json:"removedMemberIds,omitempty"`
}

type GetConversationDto struct {
	TextSearch string `form:"textSearch" binding:"omitempty"`
	Limit      int    `form:"limit" binding:"omitempty"`
	Offset     int    `form:"offset" binding:"omitempty"`
}
