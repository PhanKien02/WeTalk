package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	JWT_SECRET  string
	RabbitMQURL string
}

var AppConfig Config

func Init() error {

	err := godotenv.Load()

	if err != nil {
		return err
	}

	AppConfig = Config{
		Port:        getEnvOrPanic("PORT"),
		JWT_SECRET:  getEnvOrPanic("JWT_SECRET"),
		RabbitMQURL: getEnvOrPanic("RABBITMQ_URL"),
	}

	return nil
}

func getEnvOrPanic(key string) string {
	val := os.Getenv(key)
	if val == "" {
		panic(fmt.Sprintf("❌ Missing required environment variable: %s", key))
	}
	return val
}
