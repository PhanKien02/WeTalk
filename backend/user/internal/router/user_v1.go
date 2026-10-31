package router

import (
	"wetalk/internal/handler"
	"wetalk/internal/repository"
	"wetalk/internal/service"
	"wetalk/rabbitmq"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func UserRoutes(r *gin.RouterGroup, db *gorm.DB, rabbitMQ rabbitmq.RabbitMQService) {
	userRepo := repository.NewUserRepository(db)
	service := service.NewUserService(userRepo, rabbitMQ)
	handler := handler.NewUserHandler(service)

	r.GET("", handler.FindAll)
	r.GET("/:id", handler.GetByID)
	r.PUT("/:id", handler.Update)
}
