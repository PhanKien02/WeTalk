package router

import (
	"conversation/internal/handler"
	"conversation/internal/repository"
	"conversation/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthRoutes(r *gin.RouterGroup, db *gorm.DB) {
	authRepo := repository.NewConversationRepository(db)
	service := services.NewConversationService(authRepo)
	handler := handler.NewConversationHandle(service)

	r.POST("/", handler.CreateConversation)
	r.GET("/", handler.FindAll)
	r.POST("/:id", handler.FindById)
	r.DELETE("/:id", handler.DeleteConversation)
	r.PUT("/:id", handler.UpdateConversation)

}
