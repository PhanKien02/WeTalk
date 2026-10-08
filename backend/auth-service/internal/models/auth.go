package models

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Auth struct {
	ID           string `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" gorm:"index;unique"`
	Password     string `json:"password" gorm:"not null"`
	Phone        string `json:"phone" gorm:"index;unique;size:10"`
	RefreshToken string `json:"refresh_token"`
}

func (a *Auth) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}
	return nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func Compare(hash string, password string) bool {
	err := bcrypt.CompareHashAndPassword(
		[]byte(hash),
		[]byte(password),
	)
	if err != nil {
		fmt.Println("compare error:", err)
		return false
	}
	return true
}

type AuthRepository interface {
	Create(c context.Context, user *Auth) error
	GetByEmail(c context.Context, email string) (Auth, error)
}
