package user

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/lib"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/middleware"
	user_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/user/repository"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type UserHandler interface {
	GetProfile(w http.ResponseWriter, r *http.Request)
	UpdateProfile(w http.ResponseWriter, r *http.Request)
	SetPrimaryResume(w http.ResponseWriter, r *http.Request)
	DeleteUser(w http.ResponseWriter, r *http.Request)
}

type userHandler struct {
	svc userService
	log zerolog.Logger
}

func new(log zerolog.Logger, cfg *config.Config, db *pgxpool.Pool) (UserHandler, error) {
	svc, err := newService(serviceParams{
		ctx:  context.Background(),
		cfg:  cfg,
		log:  log,
		repo: user_repository.New(db),
	})
	if err != nil {
		return nil, err
	}

	return &userHandler{svc: svc, log: log}, nil
}

func (h *userHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	profile, err := h.svc.getProfile(userID)
	if err != nil {
		statusCode, message := userErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "profile fetched", Data: profile})
}

func (h *userHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	profileID, err := uuid.Parse(strings.TrimSpace(chi.URLParam(r, "profileId")))
	if err != nil {
		http.Error(w, "invalid profileId", http.StatusBadRequest)
		return
	}

	var req updateProfileRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	profile, err := h.svc.updateUserProfile(updateProfileData{
		profileId:        profileID,
		userId:           userID,
		name:             req.Name,
		jobTitle:         req.JobTitle,
		description:      req.Description,
		resumeKey:        req.ResumeKey,
		primaryResumeKey: req.PrimaryResumeKey,
	})
	if err != nil {
		statusCode, message := userErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "profile updated", Data: profile})
}

func (h *userHandler) SetPrimaryResume(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req setPrimaryResumeRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	profile, err := h.svc.setPrimaryResume(userID, req.ResumeKey)
	if err != nil {
		statusCode, message := userErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "primary resume updated", Data: profile})
}

func (h *userHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ok, err := h.svc.deleteUser(userID)
	if err != nil {
		statusCode, message := userErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: ok, Message: "user deleted"})
}
