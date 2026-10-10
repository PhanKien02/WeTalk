package repository

import (
	"context"
	"wetalk/internal/dto"
	"wetalk/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	err := r.db.WithContext(ctx).Model(&models.User{}).Create(user).Error
	return err
}

func (r *UserRepository) FindAll(ctx context.Context, query *dto.QueryUserDto) ([]models.User, error) {
	var users []models.User
	err := r.db.WithContext(ctx).Model(&models.User{}).Where("email LIKE ? or phone LIKE ? or name LIKE ? and is_active = true", "%"+query.TextSearch+"%", "%"+query.TextSearch+"%", "%"+query.TextSearch+"%").Limit(query.Limit).Offset(query.Offset).Find(&users).Error
	return users, err
}

func (r *UserRepository) GetByLogin(ctx context.Context, login string) (models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Model(&models.User{}).Where("email = ? or phone = ?", login, login).First(&user).Error
	return user, err
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", id).First(&user).Error
	return user, err
}

func (r *UserRepository) Update(ctx context.Context, id string, user *dto.UpdateUserReq) error {
	err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", id).Updates(user).Error
	return err
}
