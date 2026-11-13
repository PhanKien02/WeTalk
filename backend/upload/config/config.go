package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string

	R2AccountID       string
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2Bucket          string
	// R2PublicURL is the public base URL of the bucket (r2.dev subdomain or a
	// custom domain), e.g. https://pub-xxxx.r2.dev or https://cdn.example.com.
	R2PublicURL string
	// R2Endpoint overrides https://<account>.r2.cloudflarestorage.com. Optional.
	R2Endpoint string

	// MaxUploadSize is the largest accepted file, in bytes.
	MaxUploadSize int64
}

var AppConfig Config

func Init() error {
	if err := godotenv.Load(); err != nil {
		return err
	}

	maxMB, err := strconv.ParseInt(getEnv("UPLOAD_MAX_SIZE_MB", "10"), 10, 64)
	if err != nil || maxMB <= 0 {
		return fmt.Errorf("invalid UPLOAD_MAX_SIZE_MB: %q", os.Getenv("UPLOAD_MAX_SIZE_MB"))
	}

	AppConfig = Config{
		Port: getEnv("PORT", "8085"),

		R2AccountID:       getEnvOrPanic("R2_ACCOUNT_ID"),
		R2AccessKeyID:     getEnvOrPanic("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey: getEnvOrPanic("R2_SECRET_ACCESS_KEY"),
		R2Bucket:          getEnvOrPanic("R2_BUCKET"),
		R2PublicURL:       getEnvOrPanic("R2_PUBLIC_URL"),
		R2Endpoint:        os.Getenv("R2_ENDPOINT"),

		MaxUploadSize: maxMB << 20,
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}

func getEnvOrPanic(key string) string {
	val := os.Getenv(key)
	if val == "" {
		panic(fmt.Sprintf("❌ Missing required environment variable: %s", key))
	}
	return val
}
