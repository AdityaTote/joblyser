package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/token"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type contextKey string

const userIDContextKey contextKey = "user_id"

func Auth(next http.Handler, cfg *config.Config, log zerolog.Logger) http.Handler {
	return AuthWithConfig(cfg, log)(next)
}

func AuthWithConfig(cfg *config.Config, log zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
			if authHeader == "" {
				http.Error(w, "authorization header is required", http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				http.Error(w, "invalid authorization scheme", http.StatusUnauthorized)
				return
			}

			claims, err := token.ParseAccessToken([]byte(cfg.JWTSecretAuth), strings.TrimSpace(parts[1]))
			if err != nil {
				log.Warn().Err(err).Msg("invalid access token")
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			userID, err := uuid.Parse(claims.UserID)
			if err != nil {
				log.Warn().Err(err).Str("uid", claims.UserID).Msg("invalid user id in token")
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDContextKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, error) {
	value := ctx.Value(userIDContextKey)
	if value == nil {
		return uuid.Nil, errors.New("user id missing in context")
	}

	userID, ok := value.(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("user id has invalid context type")
	}

	return userID, nil
}
