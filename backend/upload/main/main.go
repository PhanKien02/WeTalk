package main

import (
	"log"

	"upload/config"
	"upload/internal/handler"
	"upload/storage/r2"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	cfg := config.AppConfig

	storage := r2.New(r2.Config{
		AccountID:       cfg.R2AccountID,
		AccessKeyID:     cfg.R2AccessKeyID,
		SecretAccessKey: cfg.R2SecretAccessKey,
		Bucket:          cfg.R2Bucket,
		PublicURL:       cfg.R2PublicURL,
		Endpoint:        cfg.R2Endpoint,
	})
	uploadHandler := handler.NewUploadHandler(storage, cfg.MaxUploadSize)

	router := gin.Default()
	// Files bigger than this are buffered to a temp file instead of memory.
	router.MaxMultipartMemory = 8 << 20

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := router.Group("/api/v1/upload")
	{
		api.POST("", uploadHandler.Upload)
	}

	log.Println("Starting server on port", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
