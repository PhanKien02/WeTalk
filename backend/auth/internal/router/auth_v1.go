package router

import (
	"wetalk/internal/handler"
	"wetalk/internal/repository"
	"wetalk/internal/service"
	"wetalk/rabbitmq"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthRoutes(r *gin.RouterGroup, db *gorm.DB, rabbitmq rabbitmq.RabbitMQService) {
	authRepo := repository.NewAuthRepository(db)
	service := service.NewAuthService(authRepo, rabbitmq)
	handler := handler.NewAuthHandler(service)

	r.POST("/register", handler.Create)
	r.POST("/login", handler.Login)
	r.POST("/refresh-token", handler.RefreshToken)
}
