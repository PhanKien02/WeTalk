package router

import (
	"wetalk/internal/handler"
	"wetalk/internal/repository"
	"wetalk/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func UserRoutes(r *gin.RouterGroup, db *gorm.DB) {
	userRepo := repository.NewUserRepository(db)
	service := service.NewUserService(userRepo)
	handler := handler.NewUserHandler(service)

	r.GET("", handler.FindAll)
	r.GET("/:id", handler.GetByID)
}