package service

import (
	"context"
	"errors"
	"fmt"

	"wetalk/internal/dto"
	"wetalk/internal/models"
	"wetalk/internal/repository"
	"wetalk/rabbitmq"
	jwt "wetalk/utils"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
)

type AuthService struct {
	userRepo  repository.AuthRepository
	publisher rabbitmq.Publisher
}

type UserCreatedEvent struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func NewAuthService(userRepo repository.AuthRepository, publisher rabbitmq.Publisher) *AuthService {
	return &AuthService{userRepo: userRepo, publisher: publisher}
}

func (s *AuthService) Create(ctx *gin.Context, user *dto.RegisterRequest) error {
	userExist, _ := s.userRepo.GetByLogin(ctx, user.Email)

	if userExist.ID != uuid.Nil {
		return errors.New("user already exists")
	}
	hashedPassword, err := models.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword
	newAuth := models.Auth{
		Name:     user.Name,
		Email:    user.Email,
		Password: user.Password,
		Phone:    user.Phone,
	}
	userCreated, err := s.userRepo.Create(ctx, &newAuth)
	if err != nil {
		return err
	}
	event := UserCreatedEvent{
		ID:    userCreated.ID.String(),
		Name:  userCreated.Name,
		Email: userCreated.Email,
		Phone: userCreated.Phone,
	}
	err = s.publisher.Publish(ctx, "user.exchange", "user.created", event)
	if err != nil {
		return err
	}
	return nil
}

func (s *AuthService) GetByLogin(ctx context.Context, login string) (models.Auth, error) {
	return s.userRepo.GetByLogin(ctx, login)
}

func (s *AuthService) Login(ctx *gin.Context, req dto.LoginRequest) (dto.LoginResponse, error) {
	user, err := s.userRepo.GetByLogin(ctx, req.Login)
	if err != nil {
		return dto.LoginResponse{}, err
	}
	if user.ID == uuid.Nil {
		return dto.LoginResponse{}, errors.New("user not found")
	}
	if !models.Compare(user.Password, req.Password) {
		return dto.LoginResponse{}, errors.New("invalid password")
	}
	accessToken, refreshToken, err := jwt.GenerateJWT(user.ID.String())
	if err != nil {
		return dto.LoginResponse{}, err
	}
	userResponse := dto.UserResponse{
		ID:    user.ID.String(),
		Name:  user.Name,
		Email: user.Email,
		Phone: user.Phone,
	}
	loginResponse := dto.LoginResponse{
		User:  userResponse,
		Token: accessToken,
	}
	fmt.Print("refreshtoken ", refreshToken)
	fmt.Print("id", user.ID)
	err = s.userRepo.UpdateRefreshToken(ctx, user.ID.String(), refreshToken)
	if err != nil {
		return dto.LoginResponse{}, err
	}
	ctx.SetCookie("refresh_token", refreshToken, 60*60*24*7, "/", "localhost", true, true)
	return loginResponse, nil
}
