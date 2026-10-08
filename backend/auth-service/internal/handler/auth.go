package handler

import (
	"net/http"
	"wetalk/internal/dto"
	"wetalk/internal/models"
	"wetalk/internal/service"
	"wetalk/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Create(c *gin.Context) {
	var user models.Auth
	if err := c.ShouldBindJSON(&user); err != nil {
		response.Error(
			c,
			http.StatusBadRequest,
			"BAD_REQUEST",
			err.Error(),
		)
		return
	}

	err := h.service.Create(c, &user)
	if err != nil {
		response.Error(
			c,
			http.StatusBadRequest,
			"BAD_REQUEST",
			err.Error(),
		)
		return
	}

	response.OK(c, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(
			c,
			http.StatusBadRequest,
			"BAD_REQUEST",
			err.Error(),
		)
		return
	}

	login, err := h.service.Login(c, req)
	if err != nil {
		response.Error(
			c,
			http.StatusBadRequest,
			"BAD_REQUEST",
			err.Error(),
		)
		return
	}

	response.OK(c, login)
}
