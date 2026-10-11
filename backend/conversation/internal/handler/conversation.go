package handle

import (
	"conversation/internal/dto"
	models "conversation/internal/model"
	"conversation/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ConversationHandle interface {
	CreateConversation(c *gin.Context)
	UpdateConversation(c *gin.Context)
	DeleteConversation(c *gin.Context)
	FindById(c *gin.Context)
	FindAll(c *gin.Context)
}

type conversationHandle struct {
	service services.ConversationService
}

func NewConversationHandle(service services.ConversationService) ConversationHandle {
	return &conversationHandle{service: service}
}

func (h *conversationHandle) CreateConversation(c *gin.Context) {
	var conversation dto.CreateConversationDto
	if err := c.ShouldBindJSON(&conversation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.Create(&conversation)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *conversationHandle) UpdateConversation(c *gin.Context) {
	id := c.Param("id")
	var conversation models.Conversation
	if err := c.ShouldBindJSON(&conversation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Update(id, &conversation); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conversation)
}

func (h *conversationHandle) DeleteConversation(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Conversation deleted successfully"})
}

func (h *conversationHandle) FindById(c *gin.Context) {
	id := c.Param("id")
	conversation, err := h.service.FindById(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conversation)
}

func (h *conversationHandle) FindAll(c *gin.Context) {
	var query dto.GetConversationDto
	userId := c.Request.Header.Get("X-User-Id")
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversations, err := h.service.FindAll(query, userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": conversations})
}
