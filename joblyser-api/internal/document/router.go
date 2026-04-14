package document

import (
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterRoutes(r chi.Router, log zerolog.Logger, cfg *config.Config, db *pgxpool.Pool) error {
	h, err := new(log, cfg, db)
	if err != nil {
		return err
	}

	r.Post("/", h.CreateDocument)
	r.Get("/", h.GetDocuments)
	r.Get("/{documentId}", h.GetDocument)
	r.Delete("/{documentId}", h.DeleteDocument)
	return nil
}
