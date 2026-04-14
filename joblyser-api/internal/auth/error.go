package auth

import (
	"errors"
	"net/http"
)

type AuthHTTPError struct {
	StatusCode int
	Err        error
}

func (e *AuthHTTPError) Error() string {
	if e == nil || e.Err == nil {
		return http.StatusText(http.StatusInternalServerError)
	}
	return e.Err.Error()
}

func (e *AuthHTTPError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Err
}

func newAuthHTTPError(statusCode int, err error) error {
	return &AuthHTTPError{
		StatusCode: statusCode,
		Err:        err,
	}
}

func authErrorResponse(err error) (int, string) {
	if err == nil {
		return http.StatusOK, ""
	}

	var authErr *AuthHTTPError
	if errors.As(err, &authErr) {
		return authErr.StatusCode, authErr.Error()
	}

	return http.StatusInternalServerError, ErrAuthService.Error()
}

var (
	ErrAuthService       = errors.New("authentication failed")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidCredential = errors.New("invalid credentials")
	ErrInvalidInput      = errors.New("invalid input")
)
