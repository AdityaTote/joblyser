package auth

import (
	"net/http"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterRoutes(r chi.Router, log zerolog.Logger, cfg *config.Config, db *pgxpool.Pool, authMiddleware func(http.Handler) http.Handler) {
	h := new(log, cfg, db)

	r.Post("/signup", h.SignUp)
	r.Post("/signin", h.SignIn)
	r.Get("/google", h.Google)
	r.Get("/google/callback", h.GoogleCallback)

	r.With(authMiddleware).Get("/me", h.Me)
}
