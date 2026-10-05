package repository

import (
	"context"
	"wetalk/internal/models"

	"gorm.io/gorm"
)

type AuthRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) Create(ctx context.Context, user *models.Auth) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *AuthRepository) GetByLogin(ctx context.Context, login string) (models.Auth, error) {
	var user models.Auth
	err := r.db.WithContext(ctx).Where("email = ? or phone = ?", login, login).First(&user).Error
	return user, err
}
