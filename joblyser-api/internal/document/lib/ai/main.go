package vector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client interface {
	StoreDocument(ctx context.Context, input StoreDocumentParams) error
}

type config struct {
	url    string
	client *http.Client
}

func New(aiServiceURL string) Client {
	return &config{
		url: strings.TrimRight(aiServiceURL, "/"),
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (a *config) StoreDocument(ctx context.Context, input StoreDocumentParams) error {
	documentType := input.DocumentType
	if documentType == "" {
		documentType = ContentTypePDF
	}

	body := storeDocumentRequest{
		DocumentType: documentType,
		Key:          strings.TrimSpace(input.Key),
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/rag/store", a.url), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("unable to create request: %w", err)
	}

	req.Header.Set("X-Service-Name", "api")
	req.Header.Set("Authorization", input.Token)
	req.Header.Set("Content-Type", "application/json")

	res, err := a.client.Do(req)
	if err != nil {
		return fmt.Errorf("unable to make request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		return decodeUpstreamError(res)
	}

	return nil
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
						msg = strings.TrimSpace(d)
					}
				case map[string]any:
					if m, ok := d["message"].(string); ok && strings.TrimSpace(m) != "" {
						msg = strings.TrimSpace(m)
					}
				}
			} else if m, ok := payload["message"].(string); ok && strings.TrimSpace(m) != "" {
				msg = strings.TrimSpace(m)
			}
		}
	}

	if msg == "" {
		msg = fmt.Sprintf("upstream returned status %d", res.StatusCode)
	}

	return &UpstreamError{StatusCode: res.StatusCode, Message: msg}
}
