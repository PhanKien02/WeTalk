package jwt

import (
	"time"

	"wetalk/config"
	"wetalk/internal/dto"

	"github.com/golang-jwt/jwt/v5"
)

func getJWTSecret() []byte {
	return []byte(config.AppConfig.JWT_SECRET)
}

func GenerateJWT(id string) (string, string, error) {
	secret := getJWTSecret()
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"id":  id,
			"exp": time.Now().Add(time.Minute *5).Unix(),
		})
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"id":  id,
			"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
		})

	accessTokenString, err := accessToken.SignedString(secret)
	refreshTokenString, err := refreshToken.SignedString(secret)
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

func ValidateJWT(tokenString string) (dto.UserResponse, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return dto.UserResponse{}, err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		id, ok := claims["id"].(string)
		if !ok || id == "" {
			return dto.UserResponse{}, jwt.ErrTokenInvalidClaims
		}
		return dto.UserResponse{
			ID: id,
		}, nil
	}
	return dto.UserResponse{}, jwt.ErrTokenInvalidClaims
}
