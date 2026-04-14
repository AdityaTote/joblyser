package document

import (
	"context"
	"io"
	"mime/multipart"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	document_ai "github.com/AdityaTote/joblyser/joblyser-api/internal/document/lib/ai"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/document/lib/s3"
	document_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/document/repository"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type serviceParams struct {
	ctx      context.Context
	cfg      *config.Config
	log      zerolog.Logger
	repo     *document_repository.Queries
	uploader documentUploader
	deleter  documentDeleter
	vector   documentVectorStore
}

type documentUploader interface {
	GetPresignedPutURL(ctx context.Context, filename string) (*s3.PresignPutObjectResult, error)
	UploadToS3(ctx context.Context, filename string, contentType string, size int64, body io.Reader) (*string, error)
}

type documentDeleter interface {
	DeleteObject(ctx context.Context, key string) error
}

type documentVectorStore interface {
	StoreDocument(ctx context.Context, input document_ai.StoreDocumentParams) error
}

type createDocumentData struct {
	file   *multipart.FileHeader
	userID uuid.UUID
}

type createDocumentResponse struct {
	DocumentID uuid.UUID `json:"documentId"`
	Key        string    `json:"key"`
	URL        string    `json:"url"`
}

type getDocumentData struct {
	documentID uuid.UUID
	userID     uuid.UUID
}

type getDocumentsData struct {
	userID uuid.UUID
	limit  int32
	offset int32
	order  string
}

type deleteDocumentData struct {
	documentID uuid.UUID
	userID     uuid.UUID
}

type deleteDocumentResponse struct {
	Document document_repository.Document `json:"document"`
}

type documentsType struct {
	document_repository.Document
	Link string `json:"link"`
}
