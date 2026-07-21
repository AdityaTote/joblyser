package ai

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

type AIServiceResponse[T []SessionsResponse | []SessionResponse | SessionResponse | JobStatusResponse | RunAgentResponse] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

type EditChatBody struct {
	SessionId  string `json:"session_id"`
	EditedText string `json:"edited_text"`
}

type EditChatParams struct {
	ChatId string
	EditChatBody
	UserId uuid.UUID
	Token  string
}

type UpstreamError struct {
	StatusCode int
	Message    string
}

func (e *UpstreamError) Error() string {
	if e == nil || e.Message == "" {
		return "upstream service error"
	}
	return e.Message
}

type ActionEnum string

const (
	ActionReview               ActionEnum = "review"
	ActionGenerateApplyNote    ActionEnum = "apply_note"
	ActionGenerateCoverLetter  ActionEnum = "cover_letter"
	ActionGenerateLinkedInNote ActionEnum = "linkedin_note"
	ActionGenerateColdMail     ActionEnum = "cold_mail"
)

type GetSessionsParams struct {
	Limit  int
	Offset int
	UserId uuid.UUID
	Token  string
}

type GetSessionParams struct {
	SessionId string
	JobId     string
	UserId    uuid.UUID
	Token     string
}

type GetJobStatusParams struct {
	JobId  string
	UserId uuid.UUID
	Token  string
}

type ContentType string

const (
	ContentTypePDF ContentType = "pdf"
)

type GetRAGRetrievalParams struct {
	DocumentType ContentType
	UserQuery    string
	Key          string
	UserId       uuid.UUID
	Token        string
}

type RunAgentBody struct {
	Action    ActionEnum `json:"action"`
	UserQuery string     `json:"user_query"`
	JdText    string     `json:"jd_text"`
	DocKey    string     `json:"doc_key"`
	SessionId string     `json:"session_id"`
}

type RunAgentParams struct {
	RunAgentBody
	UserId uuid.UUID
	Token  string
}

type JobStatusResponse struct {
	Id        string  `json:"id"`
	Status    string  `json:"status"`
	SessionId string  `json:"session_id"`
	ChatId    *string `json:"chat_id"`
}

type RunAgentResponse struct {
	JobId     string `json:"job_id"`
	SessionId string `json:"session_id"`
	Status    string `json:"status"`
}

type SessionResponse struct {
	Id          string          `json:"id"`
	UserId      string          `json:"user_id"`
	SessionId   string          `json:"session_id"`
	JdText      string          `json:"jd_text"`
	DocKey      string          `json:"doc_key"`
	UserQuery   string          `json:"user_query"`
	AgentResult json.RawMessage `json:"agent_result"`
	CreatedAt   string          `json:"created_at"`
}

type SessionsResponse struct {
	Id        string `json:"id"`
	UserId    string `json:"user_id"`
	JdText    string `json:"jd_text,omitempty"`
	DocKey    string `json:"doc_key,omitempty"`
	CreatedAt string `json:"created_at"`
}

type AgentOutput interface {
	isAgentOutput()
}

type agentOutputType struct {
	Type ActionEnum `json:"type"`
}

func DecodeAgentOutput(raw json.RawMessage) (AgentOutput, error) {
	if len(raw) == 0 {
		return nil, nil
	}

	var meta agentOutputType
	if err := json.Unmarshal(raw, &meta); err != nil {
		return nil, fmt.Errorf("decode agent result type: %w", err)
	}

	switch meta.Type {
	case ActionReview:
		var out ReviewNodeOutput
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, fmt.Errorf("decode review output: %w", err)
		}
		return out, nil
	case ActionGenerateApplyNote:
		var out ApplyNodeOutput
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, fmt.Errorf("decode apply output: %w", err)
		}
		return out, nil
	case ActionGenerateCoverLetter:
		var out CoverLetterNodeOutput
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, fmt.Errorf("decode cover letter output: %w", err)
		}
		return out, nil
	case ActionGenerateLinkedInNote:
		var out LinkedInNoteNodeOutput
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, fmt.Errorf("decode linkedin note output: %w", err)
		}
		return out, nil
	case ActionGenerateColdMail:
		var out ColdMailNodeOutput
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, fmt.Errorf("decode cold mail output: %w", err)
		}
		return out, nil
	default:
		return nil, fmt.Errorf("unsupported agent result type: %q", meta.Type)
	}
}

type ReviewNodeOutput struct {
	Type          ActionEnum      `json:"type"`
	WhatIsJob     string          `json:"what_is_job"`
	SearchCompany json.RawMessage `json:"search_company"`
	RoleFit       json.RawMessage `json:"role_fit"`
}

func (ReviewNodeOutput) isAgentOutput() {}

type ApplyNodeOutput struct {
	Type            ActionEnum `json:"type"`
	ApplicationNote string     `json:"application_note"`
}

func (ApplyNodeOutput) isAgentOutput() {}

type CoverLetterNodeOutput struct {
	Type        ActionEnum      `json:"type"`
	CoverLetter json.RawMessage `json:"cover_letter"`
}

func (CoverLetterNodeOutput) isAgentOutput() {}

type LinkedInNoteNodeOutput struct {
	Type         ActionEnum      `json:"type"`
	LinkedinNote json.RawMessage `json:"linkedin_note"`
}

func (LinkedInNoteNodeOutput) isAgentOutput() {}

type ColdMailNodeOutput struct {
	Type     ActionEnum      `json:"type"`
	ColdMail json.RawMessage `json:"cold_mail"`
}

func (ColdMailNodeOutput) isAgentOutput() {}
