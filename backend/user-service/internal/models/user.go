package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        string    `gorm:"id;primaryKey;type:uuid"`
	Name      string    `gorm:"index"`
	Email     string    `gorm:"index;unique"`
	Avatar    string    `gorm:"type:varchar(255)"`
	Phone     string    `gorm:"index;len:10;unique"`
	Bio       string    `gorm:"type:text"`
	Location  string    `gorm:"type:varchar(255)"`
	IsActive  bool      `gorm:"default:true"`
	DeletedAt string    `gorm:"type:time;default:null"`
	CreatedAt time.Time `gorm:"type:time"`
	UpdatedAt time.Time `gorm:"type:time"`
}

func (a *User) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}
	return nil
}

type UserRepository interface {
	Create(c context.Context, user *User) error
	FindAll(c context.Context) ([]User, error)
	GetByEmail(c context.Context, email string) (User, error)
	GetByID(c context.Context, id string) (User, error)
}
