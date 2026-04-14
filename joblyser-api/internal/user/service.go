package user

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	user_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/user/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
)

var (
	errUserNotFound    = errors.New("user not found")
	errProfileNotFound = errors.New("profile not found")
)

type userService interface {
	getProfile(userId uuid.UUID) (*user_repository.GetUserInformationRow, error)
	updateUserProfile(input updateProfileData) (*user_repository.Profile, error)
	setPrimaryResume(userId uuid.UUID, resumeKey string) (*user_repository.Profile, error)
	deleteUser(userId uuid.UUID) (bool, error)
}

type service struct {
	ctx  context.Context
	cfg  *config.Config
	log  zerolog.Logger
	repo *user_repository.Queries
}

type serviceParams struct {
	ctx  context.Context
	cfg  *config.Config
	log  zerolog.Logger
	repo *user_repository.Queries
}

func newService(input serviceParams) (userService, error) {
	if input.ctx == nil {
		return nil, newUserHTTPError(http.StatusInternalServerError, errors.New("context is required"))
	}
	if input.cfg == nil {
		return nil, newUserHTTPError(http.StatusInternalServerError, errors.New("config is required"))
	}
	if input.repo == nil {
		return nil, newUserHTTPError(http.StatusInternalServerError, errors.New("repository is required"))
	}

	return &service{
		ctx:  input.ctx,
		cfg:  input.cfg,
		log:  input.log,
		repo: input.repo,
	}, nil
}

func (u *service) getProfile(userId uuid.UUID) (*user_repository.GetUserInformationRow, error) {
	// check user
	profile, err := u.repo.GetUserInformation(u.ctx, userId)
	if err != nil {
		// Backward compatibility when migration for primary_resume_key is not yet applied.
		if strings.Contains(err.Error(), "primary_resume_key") {
			legacyProfile, legacyErr := u.repo.GetUserInformationLegacy(u.ctx, userId)
			if legacyErr == nil {
				return &legacyProfile, nil
			}
		}
		if errors.Is(err, pgx.ErrNoRows) {
			u.log.Warn().Str("user_id", userId.String()).Msg("profile not found")
			return nil, newUserHTTPError(http.StatusNotFound, errProfileNotFound)
		}
		u.log.Error().Err(err).Str("user_id", userId.String()).Msg("unable to get user profile")
		return nil, newUserHTTPError(http.StatusInternalServerError, errors.New("unable to get user profile"))
	}

	return &profile, nil
}

func (u *service) updateUserProfile(input updateProfileData) (*user_repository.Profile, error) {
	var updateData user_repository.UpdateProfileParams = user_repository.UpdateProfileParams{
		ID:     input.profileId,
		UserID: input.userId,
	}

	name := strings.TrimSpace(input.name)
	description := strings.TrimSpace(input.description)
	jobTitle := strings.TrimSpace(input.jobTitle)
	resumeKey := strings.TrimSpace(input.resumeKey)
	primaryResumeKey := strings.TrimSpace(input.primaryResumeKey)

	if name != "" {
		updateData.Name = pgtype.Text{String: name, Valid: true}
	}

	if description != "" {
		updateData.Description = pgtype.Text{String: description, Valid: true}
	}

	if jobTitle != "" {
		updateData.JobTitle = pgtype.Text{String: jobTitle, Valid: true}
	}

	if resumeKey != "" {
		updateData.ResumeKey = pgtype.Text{String: resumeKey, Valid: true}
	}

	if primaryResumeKey != "" {
		updateData.PrimaryResumeKey = pgtype.Text{String: primaryResumeKey, Valid: true}
	}

	if !updateData.Name.Valid && !updateData.Description.Valid && !updateData.JobTitle.Valid && !updateData.ResumeKey.Valid && !updateData.PrimaryResumeKey.Valid {
		return nil, newUserHTTPError(http.StatusBadRequest, errors.New("at least one profile field must be provided: name, description, jobTitle, resumeKey, or primaryResumeKey"))
	}

	profile, err := u.repo.UpdateProfile(u.ctx, updateData)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			u.log.Warn().Str("user_id", input.userId.String()).Str("profile_id", input.profileId.String()).Msg("profile not found for update")
			return nil, newUserHTTPError(http.StatusNotFound, errProfileNotFound)
		}
		u.log.Error().Err(err).Str("user_id", input.userId.String()).Str("profile_id", input.profileId.String()).Msg("unable to update user profile")
		return nil, newUserHTTPError(http.StatusInternalServerError, errors.New("unable to update user profile"))
	}

	return &profile, nil
}

func (u *service) setPrimaryResume(userId uuid.UUID, resumeKey string) (*user_repository.Profile, error) {
	key := strings.TrimSpace(resumeKey)
	if key == "" {
		return nil, newUserHTTPError(http.StatusBadRequest, errors.New("resume_key is required"))
	}

	profile, err := u.repo.SetPrimaryResume(u.ctx, user_repository.SetPrimaryResumeParams{
		UserID:    userId,
		ResumeKey: key,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newUserHTTPError(http.StatusNotFound, errors.New("resume not found for user"))
		}
		u.log.Error().Err(err).Str("user_id", userId.String()).Str("resume_key", key).Msg("unable to set primary resume")
		return nil, newUserHTTPError(http.StatusInternalServerError, errors.New("unable to set primary resume"))
	}

	return &profile, nil
}

func (u *service) deleteUser(userId uuid.UUID) (bool, error) {
	if _, err := u.repo.DeleteUser(u.ctx, userId); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			u.log.Warn().Str("user_id", userId.String()).Msg("user not found for delete")
			return false, newUserHTTPError(http.StatusNotFound, errUserNotFound)
		}
		u.log.Error().Err(err).Str("user_id", userId.String()).Msg("unable to delete user")
		return false, newUserHTTPError(http.StatusInternalServerError, errors.New("unable to delete user"))
	}
	return true, nil
}
