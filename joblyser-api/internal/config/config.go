package config

import (
	"os"

	"github.com/go-playground/validator/v10"
	"github.com/knadh/koanf/parsers/dotenv"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

type Config struct {
	Port               string `koanf:"PORT" validate:"required"`
	DbHost             string `koanf:"DATABASE_HOST" validate:"required"`
	DbPort             string `koanf:"DATABASE_PORT" validate:"required"`
	DbUser             string `koanf:"DATABASE_USER" validate:"required"`
	DbPassword         string `koanf:"DATABASE_PASSWORD" validate:"required"`
	DbName             string `koanf:"DATABASE_NAME" validate:"required"`
	AwsAccessKey       string `koanf:"AWS_ACCESS_KEY" validate:"required"`
	AwsSecretKey       string `koanf:"AWS_SECRET_KEY" validate:"required"`
	AwsRegion          string `koanf:"AWS_REGION" validate:"required"`
	AwsBucketName      string `koanf:"AWS_BUCKET_NAME" validate:"required"`
	AwsCloudfrontUrl   string `koanf:"AWS_CLOUDFRONT_URL" validate:"required"`
	JWTSecretAuth      string `koanf:"JWT_SECRET_AUTH" validate:"required"`
	JWTSecretAIService string `koanf:"JWT_SECRET_SERVICE" validate:"required"`
	AIServiceURI       string `koanf:"AI_SERVICE_URI" validate:"required"`
	GoogleClientID     string `koanf:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `koanf:"GOOGLE_CLIENT_SECRET"`
	GoogleRedirectURI  string `koanf:"GOOGLE_REDIRECT_URI"`
	GoogleScopes       string `koanf:"GOOGLE_SCOPES"`
}

func LoadConfig() (*Config, error) {
	k := koanf.New(".")

	if _, err := os.Stat(".env"); err == nil {
		if err := k.Load(file.Provider(".env"), dotenv.Parser()); err != nil {
			return nil, err
		}
	}

	if err := k.Load(env.Provider("", ".", nil), nil); err != nil {
		return nil, err
	}

	var cfg Config
	if err := k.Unmarshal("", &cfg); err != nil {
		return nil, err
	}

	validate := validator.New()
	if err := validate.Struct(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
