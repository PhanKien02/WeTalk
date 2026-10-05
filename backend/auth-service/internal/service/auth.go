package service

import (
	"context"
	"errors"
	"wetalk/internal/dto"
	"wetalk/internal/models"
	"wetalk/internal/repository"
	jwt "wetalk/utils"

	"github.com/gin-gonic/gin"
)

type AuthService struct {
	userRepo *repository.AuthRepository
}

func NewAuthService(userRepo *repository.AuthRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) Create(ctx context.Context, user *models.Auth) error {
	hashedPassword, err := models.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword

	err = s.userRepo.Create(ctx, user)
	return err
}

func (s *AuthService) GetByLogin(ctx context.Context, login string) (models.Auth, error) {
	return s.userRepo.GetByLogin(ctx, login)
}

func (s *AuthService) Login(ctx *gin.Context, req dto.LoginRequest) (dto.LoginResponse, error) {
	user, err := s.userRepo.GetByLogin(ctx, req.Login)
	if err != nil {
		return dto.LoginResponse{}, err
	}
	if !models.Compare(user.Password, req.Password) {
		return dto.LoginResponse{}, errors.New("invalid password")
	}
	accessToken, refreshToken, err := jwt.GenerateJWT(user.ID)
	if err != nil {
		return dto.LoginResponse{}, err
	}
	userResponse := dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
		Phone: user.Phone,
	}
	loginResponse := dto.LoginResponse{
		User:  userResponse,
		Token: accessToken,
	}
	ctx.SetCookie("refresh_token", refreshToken, 60*60*24*7, "/", "localhost", true, true)
	return loginResponse, nil
}
