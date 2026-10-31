package router

import (
	"wetalk/rabbitmq"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB, rabbitMQ rabbitmq.RabbitMQService) {
	UserRoutes(r.Group("/api/v1/users"), db, rabbitMQ)
}
