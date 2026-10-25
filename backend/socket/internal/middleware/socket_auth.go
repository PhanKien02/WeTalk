package middleware

import (
	"errors"
	"fmt"
	"log"
	"strings"

	"socket/internal/socketio"

	"github.com/golang-jwt/jwt/v5"
)

var errUnauthorized = errors.New("UNAUTHORIZED")

func SocketAuth(jwtSecret string) socketio.Middleware {
	secretBytes := []byte(jwtSecret)

	return func(s *socketio.Socket) error {
		h := s.Handshake()
		tokenString := socketToken(h)
		if tokenString == "" {
			return nil
		}

		userID, err := ParseUserID(tokenString, secretBytes)
		if err != nil {
			log.Printf("socket auth failed: id=%s addr=%s err=%v", s.ID(), h.Address, err)
			return errUnauthorized
		}

		s.Set("userId", userID)
		return nil
	}
}

func socketToken(h socketio.Handshake) string {
	if token, ok := h.Auth["token"].(string); ok && token != "" {
		return strings.TrimPrefix(token, "Bearer ")
	}
	if parts := strings.SplitN(h.Headers.Get("Authorization"), " ", 2); len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return parts[1]
	}
	return h.Query.Get("token")
}

// ParseUserID validates an HMAC-signed JWT and returns its "id" claim.
func ParseUserID(tokenString string, secret []byte) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return "", fmt.Errorf("invalid or expired token: %w", err)
	}
	if !token.Valid {
		return "", errors.New("invalid or expired token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("failed to parse token claims")
	}

	userID, ok := claims["id"].(string)
	if !ok || userID == "" {
		return "", errors.New("token does not contain a valid user id")
	}
	return userID, nil
}
