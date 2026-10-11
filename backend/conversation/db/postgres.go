package db

import (
	"conversation/config"
	models "conversation/internal/model"
	logger "conversation/pkg"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func ConnectDB() *gorm.DB {
	log := logger.New("info")
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		config.AppConfig.DB_HOST,
		config.AppConfig.DB_USER,
		config.AppConfig.DB_PASSWORD,
		config.AppConfig.DB_NAME,
		config.AppConfig.DB_PORT,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Info),
	})

	if err != nil {
		log.Error(err.Error())
		return nil
	}

	db.AutoMigrate(&models.Conversation{})

	sqlDB, err := db.DB()

	if err != nil {
		log.Error(err.Error())
	}

	if err := sqlDB.Ping(); err != nil {
		log.Error(err.Error())
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	return db

}
