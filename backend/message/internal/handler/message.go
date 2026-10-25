package handler

import (
	"errors"
	"message/internal/dto"
	"message/internal/services"
	"message/pkg/response"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MessageHandle interface {
	CreateMessage(c *gin.Context)
	UpdateMessage(c *gin.Context)
	DeleteMessage(c *gin.Context)
	FindAll(c *gin.Context)
}

type messageHandle struct {
	service services.MessageService
}

func NewMessageHandle(service services.MessageService) MessageHandle {
	return &messageHandle{service: service}
}

// currentUserId reads the header injected by the gateway after JWT validation.
func currentUserId(c *gin.Context) (string, bool) {
	id := c.GetHeader("X-User-Id")
	if id == "" {
		response.Error(c, http.StatusUnauthorized, "missing user id")
		return "", false
	}
	return id, true
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, services.ErrForbidden):
		response.Error(c, http.StatusForbidden, err.Error())
	case errors.Is(err, services.ErrEmptyMessage):
		response.Error(c, http.StatusBadRequest, err.Error())
	default:
		response.Error(c, http.StatusInternalServerError, err.Error())
	}
}

func (h *messageHandle) CreateMessage(c *gin.Context) {
	userId, ok := currentUserId(c)
	if !ok {
		return
	}

	var body dto.CreateMessageDto
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	message, err := h.service.Create(c.Request.Context(), userId, &body)
	if err != nil {
		handleError(c, err)
		return
	}
	response.Created(c, message)
}

func (h *messageHandle) UpdateMessage(c *gin.Context) {
	userId, ok := currentUserId(c)
	if !ok {
		return
	}

	var body dto.UpdateMessageDto
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	message, err := h.service.Update(c.Request.Context(), userId, c.Param("id"), &body)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, message)
}

func (h *messageHandle) DeleteMessage(c *gin.Context) {
	userId, ok := currentUserId(c)
	if !ok {
		return
	}

	if err := h.service.Delete(c.Request.Context(), userId, c.Param("id")); err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, gin.H{"id": c.Param("id")})
}

func (h *messageHandle) FindAll(c *gin.Context) {
	userId, ok := currentUserId(c)
	if !ok {
		return
	}

	var query dto.GetMessagesDto
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	messages, err := h.service.FindAll(c.Request.Context(), userId, query)
	if err != nil {
		handleError(c, err)
		return
	}
	response.OK(c, messages)
}
