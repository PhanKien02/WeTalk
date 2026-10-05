package router

import (
	"wetalk/internal/handler"
	"wetalk/internal/repository"
	"wetalk/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthRoutes(r *gin.RouterGroup, db *gorm.DB) {
	authRepo := repository.NewAuthRepository(db)
	service := service.NewAuthService(authRepo)
	handler := handler.NewAuthHandler(service)

	r.POST("/register", handler.Create)
	r.POST("/login", handler.Login)
}