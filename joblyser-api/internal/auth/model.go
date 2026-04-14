package auth

import (
	"context"

	auth_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/auth/repository"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type serviceParams struct {
	ctx  context.Context
	cfg  *config.Config
	log  zerolog.Logger
	repo *auth_repository.Queries
}

type credentialAuthRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type authServiceResponse struct {
	UserID uuid.UUID `json:"userId"`
	Email  string    `json:"email"`
	Token  string    `json:"token"`
}

type googleAuthorizeUrl struct {
	URL string `json:"url"`
}

type userDataType struct {
	ID    uuid.UUID
	Email string
}
