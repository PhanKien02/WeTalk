package main

import (
	"fmt"
	"log"
	"net/http"

	"gateway/config"
	"gateway/main/services"
	"gateway/middleware"
	"gateway/proxy"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize configuration
	config.Init()
	cfg := config.AppConfig

	router := gin.Default()

	// Global middlewares
	router.Use(middleware.CORSMiddleware())

	registry := services.NewServiceRegistry(
		cfg.AuthServiceURL,
		cfg.UserServiceURL,
		cfg.AuthRequiredForUsers,
	)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":   "UP",
			"services": registry,
		})
	})

	// Dynamic registration: all versions (v1, v2, v3...) share the service's base URL
	for _, svc := range registry {
		currentSvc := svc
		// Single reverse proxy pointing to the service base URL
		serviceProxy := proxy.NewReverseProxy(currentSvc.URL, currentSvc.Name)

		for _, ver := range currentSvc.SupportedVersions {
			versionName := ver
			// Route: /api/v1/auth, /api/v2/auth, /api/v3/auth, etc.
			groupPath := fmt.Sprintf("/api/%s/%s", versionName, currentSvc.PathPrefix)
			group := router.Group(groupPath)

			// 1. Version header & deprecation middleware
			group.Use(middleware.VersionMiddleware(middleware.VersionInfo{
				Version:    versionName,
				Deprecated: currentSvc.IsDeprecated(versionName),
			}))

			// 2. Authentication middleware if required
			if currentSvc.RequireAuth {
				group.Use(middleware.AuthRequired(cfg.JWTSecret))
			}

			// 3. Proxy handling
			group.Any("", serviceProxy)
			group.Any("/*path", serviceProxy)

			log.Printf("Registered route: %-22s -> %s (Auth: %v)", groupPath, currentSvc.URL, currentSvc.RequireAuth)
		}
	}

	// Fallback handler for unmatched routes or unsupported API versions
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "NOT_FOUND",
			"message": fmt.Sprintf("Route not found or API version is not supported: %s", c.Request.URL.Path),
		})
	})

	log.Printf("🚀 API Gateway is running on port :%s", cfg.Port)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start API Gateway: %v", err)
	}
}
