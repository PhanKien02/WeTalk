// Package docs serves the OpenAPI spec and a Swagger UI page for the gateway.
package docs

import (
	_ "embed"
	"net/http"

	"github.com/gin-gonic/gin"
)

//go:embed openapi.yaml
var spec []byte

// Swagger UI is loaded from a CDN so the gateway needs no extra Go dependency.
const swaggerUIPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WeTalk API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/swagger/openapi.yaml",
      dom_id: "#swagger-ui",
      persistAuthorization: true,
      withCredentials: true,
    });
  </script>
</body>
</html>`

// Register mounts GET /swagger (UI) and GET /swagger/openapi.yaml (spec).
func Register(r *gin.Engine) {
	r.GET("/swagger", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerUIPage))
	})
	r.GET("/swagger/openapi.yaml", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/yaml", spec)
	})
}
