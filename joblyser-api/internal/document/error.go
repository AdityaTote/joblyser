package document

import (
	"errors"
	"net/http"
)

type DocumentHTTPError struct {
	StatusCode int
	Err        error
}

func (e *DocumentHTTPError) Error() string {
	if e == nil || e.Err == nil {
		return http.StatusText(http.StatusInternalServerError)
	}
	return e.Err.Error()
}

func (e *DocumentHTTPError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Err
}

func newDocumentHTTPError(statusCode int, err error) error {
	return &DocumentHTTPError{StatusCode: statusCode, Err: err}
}

func documentErrorResponse(err error) (int, string) {
	if err == nil {
		return http.StatusOK, ""
	}

	var svcErr *DocumentHTTPError
	if errors.As(err, &svcErr) {
		return svcErr.StatusCode, svcErr.Error()
	}

	return http.StatusInternalServerError, "internal server error"
}
