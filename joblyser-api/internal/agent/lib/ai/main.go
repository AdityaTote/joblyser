package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type AiService interface {
	GetSessions(input GetSessionsParams) (*[]SessionsResponse, error)
	GetSession(input GetSessionParams) (*[]SessionResponse, error)
	GetJob(input GetJobStatusParams) (*JobStatusResponse, error)
	GetRAGRetrieval(input GetRAGRetrievalParams) (json.RawMessage, error)
	RunAgent(input RunAgentParams) (*RunAgentResponse, error)
	EditChat(input EditChatParams) (*SessionResponse, error)
}

func decodeUpstreamError(res *http.Response) error {
	body, _ := io.ReadAll(res.Body)
	msg := strings.TrimSpace(string(body))

	if len(body) > 0 {
		var payload map[string]any
		if err := json.Unmarshal(body, &payload); err == nil {
			if detail, ok := payload["detail"]; ok {
				switch d := detail.(type) {
				case string:
					if strings.TrimSpace(d) != "" {
						msg = d
					}
				case map[string]any:
					if m, ok := d["message"].(string); ok && strings.TrimSpace(m) != "" {
						msg = m
					}
				}
			}
		}
	}

	if msg == "" {
		msg = fmt.Sprintf("upstream returned status %d", res.StatusCode)
	}

	return &UpstreamError{StatusCode: res.StatusCode, Message: msg}
}

type AiConfig struct {
	Url    string
	client *http.Client
}

func New(aiServiceUrl string) AiService {
	return &AiConfig{
		Url: aiServiceUrl,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (a *AiConfig) GetSessions(input GetSessionsParams) (*[]SessionsResponse, error) {
	if input.Limit == 0 {
		input.Limit = 5
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/agent/sessions", a.Url), nil)
	if err != nil {
		return nil, fmt.Errorf("unable to req")
	}

	q := req.URL.Query()
	q.Add("limit", strconv.Itoa(input.Limit))
	q.Add("offset", strconv.Itoa(input.Offset))
	req.URL.RawQuery = q.Encode()

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, decodeUpstreamError(res)
	}

	var data AIServiceResponse[[]SessionsResponse]
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode playlists data: %w", err)
	}

	return &data.Data, nil
}

func (a *AiConfig) GetSession(input GetSessionParams) (*[]SessionResponse, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/agent/sessions/%s", a.Url, input.SessionId), nil)
	if err != nil {
		return nil, fmt.Errorf("unable to make req")
	}

	if input.JobId != "" {
		q := req.URL.Query()
		q.Add("job_id", input.JobId)
		req.URL.RawQuery = q.Encode()
	}

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, decodeUpstreamError(res)
	}

	var data AIServiceResponse[[]SessionResponse]
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode playlists data: %w", err)
	}

	return &data.Data, nil
}
func (a *AiConfig) GetJob(input GetJobStatusParams) (*JobStatusResponse, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/agent/status/%s", a.Url, input.JobId), nil)
	if err != nil {
		return nil, fmt.Errorf("unable to make req")
	}

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, decodeUpstreamError(res)
	}

	var data AIServiceResponse[JobStatusResponse]
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode playlists data: %w", err)
	}

	return &data.Data, nil
}

func (a *AiConfig) GetRAGRetrieval(input GetRAGRetrievalParams) (json.RawMessage, error) {
	documentType := input.DocumentType
	if documentType == "" {
		documentType = ContentTypePDF
	}

	body := struct {
		DocumentType ContentType `json:"document_type"`
		UserQuery    string      `json:"user_query"`
		Key          string      `json:"key"`
	}{
		DocumentType: documentType,
		UserQuery:    strings.TrimSpace(input.UserQuery),
		Key:          strings.TrimSpace(input.Key),
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal retrieval request body: %w", err)
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/rag/retrieval", a.Url), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("unable to make req")
	}

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, decodeUpstreamError(res)
	}

	var data struct {
		Data json.RawMessage `json:"data"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode retrieval data: %w", err)
	}

	return data.Data, nil
}

func (a *AiConfig) RunAgent(input RunAgentParams) (*RunAgentResponse, error) {
	body := RunAgentBody{
		Action:    input.Action,
		UserQuery: input.UserQuery,
		JdText:    input.JdText,
		DocKey:    input.DocKey,
		SessionId: input.SessionId,
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal request body: %w", err)
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/agent/run", a.Url), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("unable to make req")
	}

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, decodeUpstreamError(res)
	}

	var data AIServiceResponse[RunAgentResponse]
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode playlists data: %w", err)
	}

	return &data.Data, nil
}

func (a *AiConfig) EditChat(input EditChatParams) (*SessionResponse, error) {
	body := EditChatBody{
		SessionId:  input.SessionId,
		EditedText: input.EditedText,
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal request body: %w", err)
	}

	req, err := http.NewRequest("PATCH", fmt.Sprintf("%s/agent/chats/%s/edit", a.Url, input.ChatId), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("unable to make req")
	}

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, decodeUpstreamError(res)
	}

	var data AIServiceResponse[SessionResponse]
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode edit chat data: %w", err)
	}

	return &data.Data, nil
}
