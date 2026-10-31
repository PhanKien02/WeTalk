package service

import (
	"context"
	"errors"
	"fmt"
	"wetalk/internal/dto"
	"wetalk/internal/models"
	"wetalk/internal/repository"
	"wetalk/rabbitmq"
)

type UserService struct {
	userRepo *repository.UserRepository
	rabbitmq rabbitmq.RabbitMQService
}

type ActiveUserEvent struct {
	ID        string `json:"id"`
	IsSuccess bool   `json:"is_success"`
	Message   string `json:"message"`
}

func NewUserService(userRepo *repository.UserRepository, rabbitMQ rabbitmq.RabbitMQService) *UserService {
	return &UserService{userRepo: userRepo, rabbitmq: rabbitMQ}
}

func (s *UserService) HandleUserCreatedEvent(ctx context.Context, user *models.User) error {
	userExist := s.userRepo.GetByLogin(ctx, user.Email)
	fmt.Println("userExist", userExist)
	if userExist != nil {
		return errors.New("user already exists")
	}
	err := s.userRepo.Create(ctx, user)

	if err == nil {
		messageFailed := ActiveUserEvent{
			ID:        user.ID,
			IsSuccess: true,
			Message:   "User created successfully",
		}
		s.rabbitmq.Publish(ctx, rabbitmq.ExchangeUser, rabbitmq.RoutingKeyUserActive, messageFailed)
		return err
	} else {
		messageSuccess := ActiveUserEvent{
			ID:        user.ID,
			IsSuccess: true,
			Message:   err.Error(),
		}
		s.rabbitmq.Publish(ctx, rabbitmq.ExchangeUser, rabbitmq.RoutingKeyUserActive, messageSuccess)
	}
	return nil
}

func (s *UserService) FindAll(ctx context.Context, query *dto.QueryUserDto) ([]models.User, error) {
	return s.userRepo.FindAll(ctx, query)
}

func (s *UserService) GetByLogin(ctx context.Context, login string) (models.User, error) {
	user := s.userRepo.GetByLogin(ctx, login)
	if user == nil {
		return models.User{}, errors.New("user not found")
	}
	return *user, nil
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
