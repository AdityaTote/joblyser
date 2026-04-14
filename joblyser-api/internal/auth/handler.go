package auth

import (
	"context"
	"fmt"
	"net/http"

	auth_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/auth/repository"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/lib"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type UserHandler interface {
	SignUp(w http.ResponseWriter, r *http.Request)
	SignIn(w http.ResponseWriter, r *http.Request)
	Google(w http.ResponseWriter, r *http.Request)
	GoogleCallback(w http.ResponseWriter, r *http.Request)
}

type auth struct {
	svc authService
	log zerolog.Logger
}

func new(log zerolog.Logger, cfg *config.Config, db *pgxpool.Pool) UserHandler {
	return &auth{
		svc: newService(serviceParams{
		ctx:  context.Background(),
		cfg:  cfg,
		log:  log,
		repo: auth_repository.New(db),
	}),
		log: log,
	}
}

func (a *auth) SignUp(w http.ResponseWriter, r *http.Request) {
	a.log.Info().Msg("handling sign up request")
	input, err := validateAuthInput(r, a.log)
	if err != nil {
		a.log.Warn().Err(err).Msg("invalid sign up request")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := a.svc.signUp(input)
	if err != nil {
		a.log.Warn().Err(err).Msg("sign up failed")
		statusCode, message := authErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	fmt.Printf("Sign up successful for user: %s\n", resp.Email)
	
	lib.JSONWriter(w, http.StatusCreated, lib.JSONResponse{
		Success: true,
		Message: "sign up successful",
		Data:    resp,
	})
	return
}

func (a *auth) SignIn(w http.ResponseWriter, r *http.Request) {
	a.log.Info().Msg("handling sign in request")
	input, err := validateAuthInput(r, a.log)
	if err != nil {
		a.log.Warn().Err(err).Msg("invalid sign in request")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	resp, err := a.svc.signIn(*input)
	if err != nil {
		a.log.Warn().Err(err).Msg("sign in failed")
		statusCode, message := authErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}
	
	fmt.Printf("Sign in successful for user: %s\n", resp.Email)
	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{
		Success: true,
		Message: "sign in successful",
		Data:    resp,
	})
	return
}

func (a *auth) Google(w http.ResponseWriter, r *http.Request) {
	a.log.Info().Msg("handling google auth request")
	resp, err := a.svc.getAuthorizeUrl()
	if err != nil {
		a.log.Warn().Err(err).Msg("failed to get google authorize url")
		statusCode, message := authErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{
		Success: true,
		Message: "google authorize url",
		Data:    resp,
	})
	return
}

func (a *auth) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	a.log.Info().Msg("handling google auth callback request")
	code := r.URL.Query().Get("code")
	if code == "" {
		a.log.Warn().Msg("code query parameter is missing")
		http.Error(w, "code query parameter is required", http.StatusBadRequest)
		return
	}
	resp, err := a.svc.generateAccessToken(code)
	if err != nil {
		a.log.Warn().Err(err).Msg("google auth callback failed")
		statusCode, message := authErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{
		Success: true,
		Message: "google auth callback successful",
		Data:    resp,
	})
	return
}