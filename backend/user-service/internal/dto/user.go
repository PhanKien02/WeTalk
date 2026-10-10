package dto

type UpdateUserReq struct {
	Email    string `json:"email" binding:"omitempty,email"`
	Name     string `json:"name" binding:"omitempty"`
	Phone    string `json:"phone" binding:"omitempty"`
	Avatar   string `json:"avatar" binding:"omitempty"`
	Bio      string `json:"bio" binding:"omitempty"`
	Location string `json:"location" binding:"omitempty"`
}

type QueryUserDto struct {
	Limit      int    `form:"limit" binding:"omitempty"`
	Offset     int    `form:"offset" binding:"omitempty"`
	TextSearch string `form:"search" binding:"omitempty"`
}
