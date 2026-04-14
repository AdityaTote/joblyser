package user

import (
	"errors"
	"net/http"
)

type UserHTTPError struct {
	StatusCode int
	Err        error
}

func (e *UserHTTPError) Error() string {
	if e == nil || e.Err == nil {
		return http.StatusText(http.StatusInternalServerError)
	}
	return e.Err.Error()
}

func (e *UserHTTPError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Err
}

func newUserHTTPError(statusCode int, err error) error {
	return &UserHTTPError{StatusCode: statusCode, Err: err}
}

func userErrorResponse(err error) (int, string) {
	if err == nil {
		return http.StatusOK, ""
	}

	var svcErr *UserHTTPError
	if errors.As(err, &svcErr) {
		return svcErr.StatusCode, svcErr.Error()
	}

	return http.StatusInternalServerError, "internal server error"
}
