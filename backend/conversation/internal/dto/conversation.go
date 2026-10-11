package dto

type CreateConversationDto struct {
	IsGroup     *bool    `json:"isGroup" binding:"required"`
	GroupName   string   `json:"groupName" binding:"required"`
	GroupAvatar string   `json:"groupAvatar" binding:"required"`
	Description string   `json:"description" binding:"required"`
	Tags        []string `json:"tags" binding:"required"`
	MemberIds   []string `json:"memberIds" binding:"required"`
}
type GetConversationDto struct {
	TextSearch string `form:"textSearch" binding:"omitempty"`
	Limit      int    `form:"limit" binding:"omitempty"`
	Offset     int    `form:"offset" binding:"omitempty"`
}
