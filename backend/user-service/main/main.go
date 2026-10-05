package main

import (
	"wetalk/config"
	"wetalk/db"

	"github.com/gin-gonic/gin"
)

func main() {
  config.Init() 
  router := gin.Default()
  var err  = db.ConnectDB()
  if(err != nil){
    panic(err.Error())
  }
  router.GET("/ping", func(c *gin.Context) {
    c.JSON(200, gin.H{
      "message": "pong",
    })
  })
  router.Run(":" + config.AppConfig.Port) // listens on 0.0.0.0:8080 by default
}