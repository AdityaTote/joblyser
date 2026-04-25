package agent

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/agent/lib/ai"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/lib"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"
)

type AgentHandler interface {
	GetSessions(w http.ResponseWriter, r *http.Request)
	GetSession(w http.ResponseWriter, r *http.Request)
	GetJob(w http.ResponseWriter, r *http.Request)
	PostRAGRetrieval(w http.ResponseWriter, r *http.Request)
	RunAgent(w http.ResponseWriter, r *http.Request)
	EditChat(w http.ResponseWriter, r *http.Request)
}

type agentHandler struct {
	svc agentService
	log zerolog.Logger
}

func new(log zerolog.Logger, cfg *config.Config) (AgentHandler, error) {
	svc, err := newService(serviceParams{
		ctx: context.Background(),
		cfg: cfg,
		log: log,
	})
	if err != nil {
		return nil, err
	}

	return &agentHandler{svc: svc, log: log}, nil
}

func (h *agentHandler) GetSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		h.log.Warn().Err(err).Msg("missing authenticated user")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	limit := 5
	offset := 0

	if v := strings.TrimSpace(r.URL.Query().Get("limit")); v != "" {
		parsed, parseErr := strconv.Atoi(v)
		if parseErr != nil || parsed < 1 {
			http.Error(w, "limit must be a positive integer", http.StatusBadRequest)
			return
		}
		limit = parsed
	}

	if v := strings.TrimSpace(r.URL.Query().Get("offset")); v != "" {
		parsed, parseErr := strconv.Atoi(v)
		if parseErr != nil || parsed < 0 {
			http.Error(w, "offset must be a non-negative integer", http.StatusBadRequest)
			return
		}
		offset = parsed
	}

	resp, err := h.svc.getSessions(ai.GetSessionsParams{Limit: limit, Offset: offset, UserId: userID})
	if err != nil {
		statusCode, message := agentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "sessions fetched", Data: resp})
}

func (h *agentHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		h.log.Warn().Err(err).Msg("missing authenticated user")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	sessionID := strings.TrimSpace(chi.URLParam(r, "sessionId"))
	if sessionID == "" {
		http.Error(w, "sessionId path parameter is required", http.StatusBadRequest)
		return
	}

	jobID := strings.TrimSpace(r.URL.Query().Get("jobId"))
	resp, err := h.svc.getSession(ai.GetSessionParams{SessionId: sessionID, JobId: jobID, UserId: userID})
	if err != nil {
		statusCode, message := agentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "session fetched", Data: resp})
}

func (h *agentHandler) GetJob(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		h.log.Warn().Err(err).Msg("missing authenticated user")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	jobID := strings.TrimSpace(chi.URLParam(r, "jobId"))
	if jobID == "" {
		http.Error(w, "jobId path parameter is required", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.getJob(ai.GetJobStatusParams{JobId: jobID, UserId: userID})
	if err != nil {
		statusCode, message := agentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "job fetched", Data: resp})
}

func (h *agentHandler) PostRAGRetrieval(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		h.log.Warn().Err(err).Msg("missing authenticated user")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req ragRetrievalRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	documentType := strings.TrimSpace(req.DocumentType)
	if documentType == "" {
		http.Error(w, "document_type is required", http.StatusBadRequest)
		return
	}

	userQuery := strings.TrimSpace(req.UserQuery)
	if userQuery == "" {
		http.Error(w, "user_query is required", http.StatusBadRequest)
		return
	}

	key := strings.TrimSpace(req.Key)
	if key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.getRAGRetrieval(ai.GetRAGRetrievalParams{
		DocumentType: ai.ContentType(documentType),
		UserQuery:    userQuery,
		Key:          key,
		UserId:       userID,
	})
	if err != nil {
		statusCode, message := agentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "retrieval fetched", Data: resp})
}

func (h *agentHandler) RunAgent(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		h.log.Warn().Err(err).Msg("missing authenticated user")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req runAgentRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	action := ai.ActionEnum(strings.TrimSpace(req.Action))
	if action == "" {
		http.Error(w, "action is required", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.runAgent(ai.RunAgentParams{
		RunAgentBody: ai.RunAgentBody{
			Action:    action,
			UserQuery: strings.TrimSpace(req.UserQuery),
			JdText:    strings.TrimSpace(req.JdText),
			DocKey:    strings.TrimSpace(req.DocKey),
			SessionId: strings.TrimSpace(req.SessionId),
		},
		UserId: userID,
	})
	if err != nil {
		statusCode, message := agentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}
	// w.Write()

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "agent started", Data: resp})
}

func (h *agentHandler) EditChat(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		h.log.Warn().Err(err).Msg("missing authenticated user")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	chatID := strings.TrimSpace(chi.URLParam(r, "chatId"))
	if chatID == "" {
		http.Error(w, "chatId path parameter is required", http.StatusBadRequest)
		return
	}

	var req editChatRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	sessionID := strings.TrimSpace(req.SessionId)
	if sessionID == "" {
		http.Error(w, "session_id is required", http.StatusBadRequest)
		return
	}

	editedText := strings.TrimSpace(req.EditedText)
	if editedText == "" {
		http.Error(w, "edited_text is required", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.editChat(ai.EditChatParams{
		ChatId: chatID,
		EditChatBody: ai.EditChatBody{
			SessionId:  sessionID,
			EditedText: editedText,
		},
		UserId: userID,
	})
	if err != nil {
		statusCode, message := agentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "chat updated", Data: resp})
}
