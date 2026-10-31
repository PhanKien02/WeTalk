package handler

import (
	"net/http"
	"wetalk/internal/dto"
	"wetalk/internal/service"
	"wetalk/pkg/response"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) FindAll(c *gin.Context) {
	query := dto.QueryUserDto{}
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	users, err := h.service.FindAll(c.Request.Context(), &query)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.OK(c, users)
}

func (h *UserHandler) GetByLogin(c *gin.Context) {
	login := c.Param("login")
	user, err := h.service.GetByLogin(c.Request.Context(), login)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var user dto.UpdateUserReq
	err := c.ShouldBindJSON(&user)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	err = h.service.Update(c.Request.Context(), id, &user)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.OK(c, "Update success")
}
