package handler

import (
	"conversation/internal/dto"
	models "conversation/internal/model"
	"conversation/internal/services"
	"errors"
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

func errorStatus(err error) int {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, services.ErrForbidden):
		return http.StatusForbidden
	default:
		return http.StatusInternalServerError
	}
}

func (h *conversationHandle) CreateConversation(c *gin.Context) {
	var conversation dto.CreateConversationDto
	if err := c.ShouldBindJSON(&conversation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if userId := c.GetHeader("X-User-Id"); userId != "" {
		found := false
		for _, id := range conversation.MemberIds {
			if id == userId {
				found = true
				break
			}
		}
		if !found {
			conversation.MemberIds = append([]string{userId}, conversation.MemberIds...)
		}
	}

	result, err := h.service.Create(c.Request.Context(), &conversation)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *conversationHandle) UpdateConversation(c *gin.Context) {
	id := c.Param("id")
	var conversation models.Conversation
	if err := c.ShouldBindJSON(&conversation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.Update(c.Request.Context(), c.GetHeader("X-User-Id"), id, &conversation)
	if err != nil {
		c.JSON(errorStatus(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *conversationHandle) DeleteConversation(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), c.GetHeader("X-User-Id"), id); err != nil {
		c.JSON(errorStatus(err), gin.H{"error": err.Error()})
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
	c.JSON(http.StatusOK, gin.H{"data": conversation})
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
