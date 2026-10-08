package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                 string
	AuthServiceURL       string
	UserServiceURL       string
	JWTSecret            string
	AuthRequiredForUsers bool
}

var AppConfig Config

func Init() {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file found, reading from system environment or defaults")
	}

	authRequired, err := strconv.ParseBool(getEnv("AUTH_REQUIRED_FOR_USERS", "true"))
	if err != nil {
		authRequired = true
	}

	AppConfig = Config{
		Port:                 getEnv("PORT", "8080"),
		AuthServiceURL:       getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		UserServiceURL:       getEnv("USER_SERVICE_URL", "http://localhost:8082"),
		JWTSecret:            getEnv("JWT_SECRET", "sadfdsfasdkfnasdfkasldfnasdf8wqe475rq38rfasdfklaadsfasdfas"),
		AuthRequiredForUsers: authRequired,
	}
}

func getEnv(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}
