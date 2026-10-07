package main

import (
	"wetalk/config"
	"wetalk/db"
	"wetalk/internal/router"

	"github.com/gin-gonic/gin"
)

func main() {
	config.Init()
	r := gin.Default()
	db := db.ConnectDB()

	router.SetupRoutes(r, db)
	r.Run(":" + config.AppConfig.Port)
}
