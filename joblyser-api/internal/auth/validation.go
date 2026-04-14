package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/rs/zerolog"
)

func validateAuthInput(r *http.Request, log zerolog.Logger) (*credentialAuthRequest, error) {
	var input_data credentialAuthRequest

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(&input_data); err != nil {
		return nil, err
	}

	validate := validator.New()

	err := validate.Struct(input_data)
	if err != nil {
		log.Error().Err(err).Msg("validation failed for auth input validation")

		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			return nil, formatValidationError(validationErrors)
		}
		return nil, ErrInvalidInput
	}

	return &input_data, nil
}

func formatValidationError(errs validator.ValidationErrors) error {
	var errorMessages []string

	for _, err := range errs {
		switch err.Field() {
		case "Email":
			errorMessages = append(errorMessages, "email is required")
		case "Password":
			if err.Tag() == "required" {
				errorMessages = append(errorMessages, "password is required")
			} else if err.Tag() == "min" {
				errorMessages = append(errorMessages, "password must be at least 8 characters long")
			}
		}
	}
	if len(errorMessages) == 0 {
		return ErrInvalidInput
	}

	return errors.New(strings.Join(errorMessages, ", "))
}
