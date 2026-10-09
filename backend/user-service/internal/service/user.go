package service

import (
	"context"
	"errors"
	"wetalk/internal/dto"
	"wetalk/internal/models"
	"wetalk/internal/repository"
)

type UserService struct {
	userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) HandleUserCreatedEvent(ctx context.Context, user *models.User) error {
	userExist, err := s.userRepo.GetByLogin(ctx, user.Email)
	if err == nil {
		return nil
	}
	if userExist.ID != "" {
		return errors.New("user already exists")
	}
	return s.userRepo.Create(ctx, user)
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

func (s *UserService) Update(ctx context.Context, id string, userUpdate *dto.UpdateUserReq) error {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if user.ID == "" {
		return errors.New("user not found")
	}
	return s.userRepo.Update(ctx, id, userUpdate)
}
