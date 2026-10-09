package repository

import (
	"context"
	"wetalk/internal/dto"
	"wetalk/internal/models"
	logger "wetalk/pkg"

	"gorm.io/gorm"
)

type AuthRepository interface {
	Create(c context.Context, user *dto.RegisterRequest) (*models.Auth, error)
	GetByLogin(c context.Context, login string) (models.Auth, error)
	UpdateRefreshToken(c context.Context, userID string, refreshToken string) error
}
type authrepository struct {
	db     *gorm.DB
	logger *logger.Logger
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	logger := logger.New("Info")
	return &authrepository{
		db:     db,
		logger: logger}
}

func (r *authrepository) Create(ctx context.Context, user *dto.RegisterRequest) (*models.Auth, error) {
	var newAuth models.Auth
	err := r.db.Model(&models.Auth{}).Create(user).Scan(&newAuth).Error
	return &newAuth, err
}

func (r *authrepository) GetByLogin(ctx context.Context, login string) (models.Auth, error) {
	var user models.Auth
	err := r.db.Model(&models.Auth{}).Where("email = ? or phone = ?", login, login).First(&user).Error
	return user, err
}

func (r *authrepository) UpdateRefreshToken(ctx context.Context, userID string, refreshToken string) error {
	return r.db.Model(&models.Auth{}).Where("id = ?", userID).Update("refresh_token", refreshToken).Error
}
