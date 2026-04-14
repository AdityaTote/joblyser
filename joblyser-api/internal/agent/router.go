package agent

import (
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"
)

func RegisterRoutes(r chi.Router, log zerolog.Logger, cfg *config.Config) error {
	h, err := new(log, cfg)
	if err != nil {
		return err
	}

	r.Get("/sessions", h.GetSessions)
	r.Get("/sessions/{sessionId}", h.GetSession)
	r.Get("/jobs/{jobId}", h.GetJob)
	r.Post("/rag/retrieval", h.PostRAGRetrieval)
	r.Post("/run", h.RunAgent)
	r.Patch("/chats/{chatId}/edit", h.EditChat)
	return nil
}
