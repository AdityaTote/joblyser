package vector

import "fmt"

type ContentType string

const (
	ContentTypePDF ContentType = "pdf"
)

type StoreDocumentParams struct {
	DocumentType ContentType
	Key          string
	Token        string
}

type storeDocumentRequest struct {
	DocumentType ContentType `json:"document_type"`
	Key          string      `json:"key"`
}

type UpstreamError struct {
	StatusCode int
	Message    string
}

func (e *UpstreamError) Error() string {
	if e == nil {
		return "upstream service error"
	}
	if e.Message != "" {
		return e.Message
	}
	return fmt.Sprintf("upstream service error (status %d)", e.StatusCode)
}
