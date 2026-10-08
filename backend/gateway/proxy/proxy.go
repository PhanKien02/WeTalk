package proxy

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

// ProxyOptions provides configuration for reverse proxying and path rewrite
type ProxyOptions struct {
	ServiceName string
	TargetURL   string
	PathPrefix  string // Original route prefix, e.g. "/api/v2/users"
	RewriteTo   string // Optional downstream prefix rewrite, e.g. "/api/v1/users"
}

// NewReverseProxy creates a reverse proxy handler forwarding requests to the target service
func NewReverseProxy(targetURL string, serviceName string) gin.HandlerFunc {
	return NewReverseProxyWithOptions(ProxyOptions{
		TargetURL:   targetURL,
		ServiceName: serviceName,
	})
}

// NewReverseProxyWithOptions creates a reverse proxy handler with optional path rewriting
func NewReverseProxyWithOptions(opts ProxyOptions) gin.HandlerFunc {
	remote, err := url.Parse(opts.TargetURL)
	if err != nil {
		log.Fatalf("Invalid target URL for %s: %s (%v)", opts.ServiceName, opts.TargetURL, err)
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = remote.Host

		// Optional path rewrite if configured
		if opts.PathPrefix != "" && opts.RewriteTo != "" {
			if strings.HasPrefix(req.URL.Path, opts.PathPrefix) {
				req.URL.Path = opts.RewriteTo + strings.TrimPrefix(req.URL.Path, opts.PathPrefix)
			}
		}

		// Set forwarding headers
		if clientIP := req.RemoteAddr; clientIP != "" {
			req.Header.Set("X-Forwarded-For", clientIP)
		}
		req.Header.Set("X-Forwarded-Host", req.Host)
		if req.TLS != nil {
			req.Header.Set("X-Forwarded-Proto", "https")
		} else {
			req.Header.Set("X-Forwarded-Proto", "http")
		}
	}

	// Custom error handler when downstream service is down
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("[GATEWAY ERROR] Failed to proxy request to %s (%s): %v", opts.ServiceName, opts.TargetURL, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		_ = json.NewEncoder(w).Encode(gin.H{
			"error":   "BAD_GATEWAY",
			"message": fmt.Sprintf("Service '%s' is currently unreachable", opts.ServiceName),
			"service": opts.ServiceName,
		})
	}

	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
