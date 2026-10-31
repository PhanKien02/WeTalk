package models

import (
	"context"
	"time"
)

type User struct {
	ID        string    `json:"id" gorm:"id;primaryKey;type:uuid"`
	Name      string    `json:"name" gorm:"index"`
	Email     string    `json:"email" gorm:"index;unique"`
	Avatar    string    `json:"avatar" gorm:"type:varchar(255)"`
	Phone     string    `json:"phone" gorm:"index;len:10;unique"`
	Bio       string    `json:"bio" gorm:"type:text;index"`
	Location  string    `json:"location" gorm:"type:varchar(255);index"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	DeletedAt string    `json:"deleted_at" gorm:"type:time;default:null"`
	CreatedAt time.Time `json:"created_at" gorm:"type:time"`
	UpdatedAt time.Time `json:"updated_at" gorm:"type:time"`
}

type UserRepository interface {
	Create(c context.Context, user *User) error
	FindAll(c context.Context) ([]User, error)
	GetByEmail(c context.Context, email string) (User, error)
	GetByID(c context.Context, id string) (User, error)
}
