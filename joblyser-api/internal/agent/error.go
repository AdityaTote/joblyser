package agent

import (
	"errors"
	"net/http"
)

type AgentHTTPError struct {
	StatusCode int
	Err        error
}

func (e *AgentHTTPError) Error() string {
	if e == nil || e.Err == nil {
		return http.StatusText(http.StatusInternalServerError)
	}
	return e.Err.Error()
}

func (e *AgentHTTPError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Err
}

func newAgentHTTPError(statusCode int, err error) error {
	return &AgentHTTPError{StatusCode: statusCode, Err: err}
}

func agentErrorResponse(err error) (int, string) {
	if err == nil {
		return http.StatusOK, ""
	}

	var svcErr *AgentHTTPError
	if errors.As(err, &svcErr) {
		return svcErr.StatusCode, svcErr.Error()
	}

	return http.StatusInternalServerError, "internal server error"
}
