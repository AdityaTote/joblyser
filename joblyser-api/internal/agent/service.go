package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/agent/lib/ai"
	agent_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/agent/repository"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/rs/zerolog"
)

type agentService interface {
	getSessions(input ai.GetSessionsParams) (*[]ai.SessionsResponse, error)
	getSession(input ai.GetSessionParams) (*[]ai.SessionResponse, error)
	getJob(input ai.GetJobStatusParams) (*ai.JobStatusResponse, error)
	getRAGRetrieval(input ai.GetRAGRetrievalParams) (json.RawMessage, error)
	runAgent(input ai.RunAgentParams) (*ai.RunAgentResponse, error)
	editChat(input ai.EditChatParams) (*ai.SessionResponse, error)
}

type service struct {
	ctx       context.Context
	cfg       *config.Config
	log       zerolog.Logger
	repo      agent_repository.Queries
	aiService ai.AiService
}

type serviceParams struct {
	ctx context.Context
	cfg *config.Config
	log zerolog.Logger
}

func newService(input serviceParams) (agentService, error) {
	if input.ctx == nil {
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("context is required"))
	}
	if input.cfg == nil {
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("config is required"))
	}

	return &service{
		ctx:       input.ctx,
		cfg:       input.cfg,
		log:       input.log,
		aiService: ai.New(input.cfg.AIServiceURI),
	}, nil
}

func (s *service) getSessions(input ai.GetSessionsParams) (*[]ai.SessionsResponse, error) {
	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.UserId)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to create ai service token")
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("unable to create token"))
	}

	req := ai.GetSessionsParams{
		Limit:  input.Limit,
		Offset: input.Offset,
		UserId: input.UserId,
		Token:  fmt.Sprintf("Bearer %s", token),
	}

	sessions, err := s.aiService.GetSessions(req)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to get sessions")
		return nil, newAgentHTTPError(http.StatusBadGateway, errors.New("unable to get sessions"))
	}

	return sessions, nil
}

func (s *service) getSession(input ai.GetSessionParams) (*[]ai.SessionResponse, error) {
	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.UserId)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to create ai service token")
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("unable to create token"))
	}

	req := ai.GetSessionParams{
		SessionId: input.SessionId,
		JobId:     input.JobId,
		UserId:    input.UserId,
		Token:     fmt.Sprintf("Bearer %s", token),
	}

	session, err := s.aiService.GetSession(req)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Str("session_id", input.SessionId).Msg("unable to get session")
		var upstreamErr *ai.UpstreamError
		if errors.As(err, &upstreamErr) {
			return nil, newAgentHTTPError(upstreamErr.StatusCode, errors.New(upstreamErr.Message))
		}
		return nil, newAgentHTTPError(http.StatusBadGateway, errors.New("unable to get session"))
	}

	return session, nil
}

func (s *service) getJob(input ai.GetJobStatusParams) (*ai.JobStatusResponse, error) {
	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.UserId)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to create ai service token")
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("unable to create token"))
	}

	req := ai.GetJobStatusParams{
		JobId:  input.JobId,
		UserId: input.UserId,
		Token:  fmt.Sprintf("Bearer %s", token),
	}

	job, err := s.aiService.GetJob(req)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Str("job_id", input.JobId).Msg("unable to get job status")
		var upstreamErr *ai.UpstreamError
		if errors.As(err, &upstreamErr) {
			return nil, newAgentHTTPError(upstreamErr.StatusCode, errors.New(upstreamErr.Message))
		}
		return nil, newAgentHTTPError(http.StatusBadGateway, errors.New("unable to get job status"))
	}

	return job, nil
}

func (s *service) getRAGRetrieval(input ai.GetRAGRetrievalParams) (json.RawMessage, error) {
	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.UserId)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to create ai service token")
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("unable to create token"))
	}

	req := ai.GetRAGRetrievalParams{
		DocumentType: input.DocumentType,
		UserQuery:    input.UserQuery,
		Key:          input.Key,
		UserId:       input.UserId,
		Token:        fmt.Sprintf("Bearer %s", token),
	}

	retrieval, err := s.aiService.GetRAGRetrieval(req)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to fetch rag retrieval")
		var upstreamErr *ai.UpstreamError
		if errors.As(err, &upstreamErr) {
			return nil, newAgentHTTPError(upstreamErr.StatusCode, errors.New(upstreamErr.Message))
		}
		return nil, newAgentHTTPError(http.StatusBadGateway, errors.New("unable to fetch rag retrieval"))
	}

	return retrieval, nil
}

func (s *service) runAgent(input ai.RunAgentParams) (*ai.RunAgentResponse, error) {
	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.UserId)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to create ai service token")
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("unable to create token"))
	}

	if input.DocKey == "" {
		resume, err := s.repo.GetUserResume(s.ctx, input.UserId)
		if err != nil {
			return nil, fmt.Errorf("resume needed: %w", err)
		}
		if !resume.Valid {
			return nil, fmt.Errorf("resume not found")
		}
		input.DocKey = resume.String
	}

	req := ai.RunAgentParams{
		RunAgentBody: ai.RunAgentBody{
			Action:    input.Action,
			UserQuery: input.UserQuery,
			JdText:    input.JdText,
			DocKey:    input.DocKey,
			SessionId: input.SessionId,
		},
		UserId: input.UserId,
		Token:  fmt.Sprintf("Bearer %s", token),
	}

	job, err := s.aiService.RunAgent(req)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Str("session_id", input.SessionId).Msg("unable to run agent")
		return nil, newAgentHTTPError(http.StatusBadGateway, errors.New("unable to run agent"))
	}

	return job, nil
}

func (s *service) editChat(input ai.EditChatParams) (*ai.SessionResponse, error) {
	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.UserId)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Msg("unable to create ai service token")
		return nil, newAgentHTTPError(http.StatusInternalServerError, errors.New("unable to create token"))
	}

	req := ai.EditChatParams{
		ChatId: input.ChatId,
		EditChatBody: ai.EditChatBody{
			SessionId:  input.SessionId,
			EditedText: input.EditedText,
		},
		UserId: input.UserId,
		Token:  fmt.Sprintf("Bearer %s", token),
	}

	chat, err := s.aiService.EditChat(req)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.UserId.String()).Str("chat_id", input.ChatId).Msg("unable to edit chat")
		var upstreamErr *ai.UpstreamError
		if errors.As(err, &upstreamErr) {
			return nil, newAgentHTTPError(upstreamErr.StatusCode, errors.New(upstreamErr.Message))
		}
		return nil, newAgentHTTPError(http.StatusBadGateway, errors.New("unable to edit chat"))
	}

	return chat, nil
}
