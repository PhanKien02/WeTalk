package router

import (
	"wetalk/rabbitmq"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB, publisher rabbitmq.Publisher) {
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	AuthRoutes(r.Group("/api/v1/auth"), db, publisher)
}
