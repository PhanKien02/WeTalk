package router

import (
	"wetalk/internal/handler"
	"wetalk/internal/repository"
	"wetalk/internal/service"
	"wetalk/rabbitmq"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthRoutes(r *gin.RouterGroup, db *gorm.DB, publisher rabbitmq.Publisher) {
	authRepo := repository.NewAuthRepository(db)
	service := service.NewAuthService(authRepo, publisher)
	handler := handler.NewAuthHandler(service)

	r.POST("/register", handler.Create)
	r.POST("/login", handler.Login)
}
