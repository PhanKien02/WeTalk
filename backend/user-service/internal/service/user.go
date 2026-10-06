package service

import (
	"context"
	"wetalk/internal/models"
	"wetalk/internal/repository"
)

type UserService struct {
	userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) Create(ctx context.Context, user *models.User) error {
	err := s.userRepo.Create(ctx, user)
	return err
}

func (s *UserService) FindAll(ctx context.Context) ([]models.User, error) {
	return s.userRepo.FindAll(ctx)
}

func (s *UserService) GetByLogin(ctx context.Context, login string) (models.User, error) {
	return s.userRepo.GetByLogin(ctx, login)
}

func (s *UserService) GetByID(ctx context.Context, id string) (models.User, error) {
	return s.userRepo.GetByID(ctx, id)
}
