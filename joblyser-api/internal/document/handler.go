package document

import (
	"context"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	document_ai "github.com/AdityaTote/joblyser/joblyser-api/internal/document/lib/ai"
	document_s3 "github.com/AdityaTote/joblyser/joblyser-api/internal/document/lib/s3"
	document_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/document/repository"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/lib"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type DocumentHandler interface {
	CreateDocument(w http.ResponseWriter, r *http.Request)
	GetDocument(w http.ResponseWriter, r *http.Request)
	GetDocuments(w http.ResponseWriter, r *http.Request)
	DeleteDocument(w http.ResponseWriter, r *http.Request)
}

type documentHandler struct {
	svc documentService
	log zerolog.Logger
}

func new(log zerolog.Logger, cfg *config.Config, db *pgxpool.Pool) (DocumentHandler, error) {
	uploader := document_s3.New(document_s3.S3Params{
		Region:     cfg.AwsRegion,
		AccessKey:  cfg.AwsAccessKey,
		SecretKey:  cfg.AwsSecretKey,
		BucketName: cfg.AwsBucketName,
	})

	svc, err := newService(serviceParams{
		ctx:      context.Background(),
		cfg:      cfg,
		log:      log,
		repo:     document_repository.New(db),
		uploader: uploader,
		deleter:  uploader,
		vector:   document_ai.New(cfg.AIServiceURI),
	})
	if err != nil {
		return nil, err
	}

	return &documentHandler{svc: svc, log: log}, nil
}

func (h *documentHandler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	fileHeader, err := extractUploadFile(r, "file")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.svc.createDocument(createDocumentData{file: fileHeader, userID: userID})
	if err != nil {
		statusCode, message := documentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusCreated, lib.JSONResponse{Success: true, Message: "document created", Data: resp})
}

func (h *documentHandler) GetDocument(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	documentID, err := uuid.Parse(strings.TrimSpace(chi.URLParam(r, "documentId")))
	if err != nil {
		http.Error(w, "invalid documentId", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.getDocument(getDocumentData{documentID: documentID, userID: userID})
	if err != nil {
		statusCode, message := documentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "document fetched", Data: resp})
}

func (h *documentHandler) GetDocuments(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	limit := int32(5)
	offset := int32(0)
	order := strings.TrimSpace(r.URL.Query().Get("order"))

	if v := strings.TrimSpace(r.URL.Query().Get("limit")); v != "" {
		parsed, parseErr := strconv.Atoi(v)
		if parseErr != nil || parsed < 1 {
			http.Error(w, "limit must be a positive integer", http.StatusBadRequest)
			return
		}
		limit = int32(parsed)
	}

	if v := strings.TrimSpace(r.URL.Query().Get("offset")); v != "" {
		parsed, parseErr := strconv.Atoi(v)
		if parseErr != nil || parsed < 0 {
			http.Error(w, "offset must be a non-negative integer", http.StatusBadRequest)
			return
		}
		offset = int32(parsed)
	}

	resp, err := h.svc.getDocuments(getDocumentsData{userID: userID, limit: limit, offset: offset, order: order})
	if err != nil {
		statusCode, message := documentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "documents fetched", Data: resp})
}

func (h *documentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.UserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	documentID, err := uuid.Parse(strings.TrimSpace(chi.URLParam(r, "documentId")))
	if err != nil {
		http.Error(w, "invalid documentId", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.deleteDocument(deleteDocumentData{documentID: documentID, userID: userID})
	if err != nil {
		statusCode, message := documentErrorResponse(err)
		http.Error(w, message, statusCode)
		return
	}

	lib.JSONWriter(w, http.StatusOK, lib.JSONResponse{Success: true, Message: "document deleted", Data: resp})
}

func extractUploadFile(r *http.Request, key string) (*multipart.FileHeader, error) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return nil, err
	}

	files := r.MultipartForm.File[key]
	if len(files) == 0 {
		return nil, http.ErrMissingFile
	}

	return files[0], nil
}
