package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

// VersionInfo metadata for an API version
type VersionInfo struct {
	Version    string
	Deprecated bool
	SunsetDate string
}

// VersionMiddleware adds versioning metadata and deprecation headers to responses
func VersionMiddleware(info VersionInfo) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set response header indicating the API version served
		c.Writer.Header().Set("X-API-Version", info.Version)

		// If this version is deprecated, attach RFC-compliant deprecation headers
		if info.Deprecated {
			c.Writer.Header().Set("Deprecation", "true")
			if info.SunsetDate != "" {
				c.Writer.Header().Set("Sunset", info.SunsetDate)
			}
			c.Writer.Header().Set("Warning", fmt.Sprintf(`299 - "API %s is deprecated and will be decommissioned"`, info.Version))
		}

		c.Next()
	}
}
