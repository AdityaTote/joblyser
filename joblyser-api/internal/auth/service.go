package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	google_lib "github.com/AdityaTote/joblyser/joblyser-api/internal/auth/lib"
	auth_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/auth/repository"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
)

type authService interface {
	signUp(*credentialAuthRequest) (*authServiceResponse, error)
	signIn(credentialAuthRequest) (*authServiceResponse, error)
	getAuthorizeUrl() (*googleAuthorizeUrl, error)
	generateAccessToken(code string) (*authServiceResponse, error)
	getUserById(userId uuid.UUID) (*meResponse, error)
}

type service struct {
	ctx    context.Context
	cfg    *config.Config
	log    zerolog.Logger
	google google_lib.AuthClient
	repo   *auth_repository.Queries
}

func newService(input serviceParams) (authService) {
	return &service{
		ctx:    input.ctx,
		cfg:    input.cfg,
		log:    input.log,
		repo:   input.repo,
		google: *google_lib.New(google_lib.AuthClient{
			ClientID:     input.cfg.GoogleClientID,
			ClientSecret: input.cfg.GoogleClientSecret,
			RedirectURI:  input.cfg.GoogleRedirectURI,
			Scopes:       strings.Split(input.cfg.GoogleScopes, ","),
			HTTPClient:   http.DefaultClient,
		}),
	}
}

func (a *service) signUp(input *credentialAuthRequest) (*authServiceResponse, error) {
	// check if user exist by email
	_, err := a.repo.GetUserByEmail(a.ctx, input.Email)
	if err == nil {
		a.log.Warn().Str("email", input.Email).Msg("user already exists")
		return nil, newAuthHTTPError(http.StatusConflict, ErrUserAlreadyExists)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		a.log.Error().Err(err).Msg("failed to check user by email")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	hash_pass, err := hashPassword(input.Password)
	if err != nil {
		a.log.Error().Err(err).Msg("failed to hash password")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	var user auth_repository.User
	err = a.repo.ExecTx(a.ctx, func(qtx *auth_repository.Queries) error {

		// add user to db
		createdUser, err := qtx.CreateUserByCredential(a.ctx, auth_repository.CreateUserByCredentialParams{
			Email:    input.Email,
			Password: pgtype.Text{String: hash_pass, Valid: true},
		})
		if err != nil {
			a.log.Error().Err(err).Msg("failed to create user")
			return err
		}

		_, err = qtx.CreateProfile(a.ctx, auth_repository.CreateProfileParams{
			UserID: createdUser.ID,
			Name:   pgtype.Text{String: input.Name, Valid: true},
		})
		if err != nil {
			a.log.Error().Err(err).Msg("failed to create profile")
			return err
		}

		user = createdUser
		return nil
	})
	if err != nil {
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	// sign token
	token, err := signToken([]byte(a.cfg.JWTSecretAuth), user.ID)
	if err != nil {
		a.log.Error().Err(err).Msg("failed to generate access token")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	return &authServiceResponse{
		UserID: user.ID,
		Email:  user.Email,
		Token:  token,
	}, nil
}

func (a *service) signIn(input credentialAuthRequest) (*authServiceResponse, error) {
	// check if user exist by email
	user, err := a.repo.GetUserByEmail(a.ctx, input.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			a.log.Warn().Msg("user not found")
			return nil, newAuthHTTPError(http.StatusNotFound, ErrUserNotFound)
		}
		a.log.Error().Err(err).Msg("failed to get user by email")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	if !user.Password.Valid {
		a.log.Warn().Msg("password is not set for this user")
		return nil, newAuthHTTPError(http.StatusUnauthorized, ErrInvalidCredential)
	}

	hash_pass := verifyPassword(user.Password.String, input.Password)
	if hash_pass == false {
		a.log.Warn().Msg("password not match")
		return nil, newAuthHTTPError(http.StatusUnauthorized, ErrInvalidCredential)
	}

	// sign token
	token, err := signToken([]byte(a.cfg.JWTSecretAuth), user.ID)
	if err != nil {
		a.log.Error().Err(err).Msg("failed to generate access token")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	return &authServiceResponse{
		UserID: user.ID,
		Email:  user.Email,
		Token:  token,
	}, nil
}

func (a *service) getAuthorizeUrl() (*googleAuthorizeUrl, error) {

	url := a.google.GetAuthURI(google_lib.StateParams{
		SessionId: 3215,
	})

	return &googleAuthorizeUrl{
		URL: url,
	}, nil
}

func (a *service) generateAccessToken(code string) (*authServiceResponse, error) {

	googleTokens, err := a.google.GetAccessToken(code)
	if err != nil {
		a.log.Error().Err(err).Msg("failed to generate access token")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	googleUser, err := a.google.GetUserInfo(googleTokens.AccessToken)
	if err != nil {
		a.log.Error().Err(err).Msg("failed to generate access token")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	var user userDataType

	//check user
	userExist, err := a.repo.GetUserByEmail(a.ctx, googleUser.Email)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			a.log.Error().Err(err).Msg("failed to get user by email")
			return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
		}

		// create user
		var dbUser auth_repository.User
		err = a.repo.ExecTx(a.ctx, func(q *auth_repository.Queries) error {
			db, err := q.CreateUserByGoogle(a.ctx, auth_repository.CreateUserByGoogleParams{
				Email:        googleUser.Email,
				AccessToken:  pgtype.Text{String: googleTokens.AccessToken, Valid: true},
				RefreshToken: pgtype.Text{String: googleTokens.RefreshToken, Valid: true},
			})
			if err != nil {
				a.log.Error().Err(err).Msg("failed to generate access token")
				return err
			}

			_, err = q.CreateProfile(a.ctx, auth_repository.CreateProfileParams{
				UserID: db.ID,
				Name:   pgtype.Text{String: googleUser.Name, Valid: true},
			})
			if err != nil {
				a.log.Error().Err(err).Msg("failed to generate access token")
				return err
			}

			dbUser = db
			return nil
		})
		if err != nil {
			return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
		}

		user = userDataType{
			ID:    dbUser.ID,
			Email: dbUser.Email,
		}
	} else {
		user = userDataType{
			ID:    userExist.ID,
			Email: userExist.Email,
		}
	}

	token, err := signToken([]byte(a.cfg.JWTSecretAuth), user.ID)
	if err != nil {
		a.log.Error().Err(err).Msg("failed to generate access token")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	return &authServiceResponse{
		UserID: user.ID,
		Email:  user.Email,
		Token:  token,
	}, nil
}

func (a *service) getUserById(userId uuid.UUID) (*meResponse, error) {
	user, err := a.repo.GetUserById(a.ctx, userId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			a.log.Warn().Msg("user not found")
			return nil, newAuthHTTPError(http.StatusNotFound, ErrUserNotFound)
		}
		a.log.Error().Err(err).Msg("failed to get user by id")
		return nil, newAuthHTTPError(http.StatusInternalServerError, ErrAuthService)
	}

	return &meResponse{
		ID:    user.ID,
		Email: user.Email,
	}, nil
}
