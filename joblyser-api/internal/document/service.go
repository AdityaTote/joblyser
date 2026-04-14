package document

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	document_ai "github.com/AdityaTote/joblyser/joblyser-api/internal/document/lib/ai"
	vector "github.com/AdityaTote/joblyser/joblyser-api/internal/document/lib/ai"
	document_repository "github.com/AdityaTote/joblyser/joblyser-api/internal/document/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"
)

var (
	errDocumentNotFound = errors.New("document not found")
)

type documentService interface {
	createDocument(input createDocumentData) (*createDocumentResponse, error)
	getDocument(input getDocumentData) (*documentsType, error)
	getDocuments(input getDocumentsData) ([]documentsType, error)
	deleteDocument(input deleteDocumentData) (*deleteDocumentResponse, error)
}

type service struct {
	ctx      context.Context
	cfg      *config.Config
	log      zerolog.Logger
	repo     *document_repository.Queries
	uploader documentUploader
	deleter  documentDeleter
	vector   documentVectorStore
}

func newService(input serviceParams) (documentService, error) {
	if input.ctx == nil {
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("context is required"))
	}
	if input.repo == nil {
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("document repository is required"))
	}
	if input.uploader == nil {
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("document uploader is required"))
	}
	if input.deleter == nil {
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("document deleter is required"))
	}


	return &service{
		ctx:      input.ctx,
		cfg:      input.cfg,
		log:      input.log,
		repo:     input.repo,
		uploader: input.uploader,
		deleter:  input.deleter,
		vector:   vector.New(input.cfg.AIServiceURI),
	}, nil
}

func (s *service) createDocument(input createDocumentData) (*createDocumentResponse, error) {

	fileName := strings.TrimSpace(input.file.Filename)
	if fileName == "" {
		return nil, newDocumentHTTPError(http.StatusBadRequest, errors.New("filename is required"))
	}

	contentType := input.file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	size := input.file.Size

	file, err := input.file.Open()
	if err != nil {
		return nil, newDocumentHTTPError(http.StatusBadRequest, errors.New("invalid file"))
	}
	defer file.Close()

	key, err := s.uploader.UploadToS3(s.ctx, fileName, contentType, size, file)
	if err != nil {
		s.log.Error().Err(err).Str("file_name", fileName).Msg("failed to create presigned upload url")
		return nil, newDocumentHTTPError(http.StatusBadGateway, errors.New("failed to create upload url"))
	}

	Key := *key

	doc, err := s.repo.CreateDocument(s.ctx, document_repository.CreateDocumentParams{
		Key:    Key,
		UserID: input.userID,
	})
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.userID.String()).Msg("failed to create document")
		if deleteErr := s.deleter.DeleteObject(s.ctx, Key); deleteErr != nil {
			s.log.Warn().Err(deleteErr).Str("key", Key).Msg("failed to cleanup s3 object after db error")
		}
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("failed to create document"))
	}

	token, err := signToken([]byte(s.cfg.JWTSecretAIService), input.userID)
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.userID.String()).Msg("failed to create ai service token")
		s.rollbackDocumentCreate(input.userID, doc.ID, Key)
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("failed to create ai service token"))
	}

	if err := s.vector.StoreDocument(s.ctx, document_ai.StoreDocumentParams{
		DocumentType: document_ai.ContentTypePDF,
		Key:          Key,
		Token:        fmt.Sprintf("Bearer %s", token),
	}); err != nil {
		s.log.Error().Err(err).Str("user_id", input.userID.String()).Str("key", Key).Msg("failed to store document in vector db")
		s.rollbackDocumentCreate(input.userID, doc.ID, Key)

		var upstreamErr *document_ai.UpstreamError
		if errors.As(err, &upstreamErr) {
			return nil, newDocumentHTTPError(http.StatusBadGateway, errors.New(upstreamErr.Message))
		}

		return nil, newDocumentHTTPError(http.StatusBadGateway, errors.New("failed to store document in vector db"))
	}

	return &createDocumentResponse{
		DocumentID: doc.ID,
		Key:        doc.Key,
		URL:        fmt.Sprintf("%s/%s", s.cfg.AwsCloudfrontUrl, doc.Key),
	}, nil
}

func (s *service) getDocument(input getDocumentData) (*documentsType, error) {
	doc, err := s.repo.GetDocumentByUserAndId(s.ctx, document_repository.GetDocumentByUserAndIdParams{
		ID:     input.documentID,
		UserID: input.userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newDocumentHTTPError(http.StatusNotFound, errDocumentNotFound)
		}
		s.log.Error().Err(err).Str("document_id", input.documentID.String()).Str("user_id", input.userID.String()).Msg("failed to get document")
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("failed to get document"))
	}

	return &documentsType{
		Document: doc,
		Link:     fmt.Sprintf("%s/%s", s.cfg.AwsCloudfrontUrl, doc.Key),
	}, nil
}

func (s *service) getDocuments(input getDocumentsData) ([]documentsType, error) {
	order := strings.ToLower(strings.TrimSpace(input.order))
	if order == "" {
		order = "desc"
	}
	if order != "asc" && order != "desc" {
		return nil, newDocumentHTTPError(http.StatusBadRequest, errors.New("order must be asc or desc"))
	}

	documents, err := s.repo.GetDocumentByUserId(s.ctx, document_repository.GetDocumentByUserIdParams{
		UserID:  input.userID,
		Column2: input.limit,
		Column3: input.offset,
		Column4: order,
	})
	if err != nil {
		s.log.Error().Err(err).Str("user_id", input.userID.String()).Msg("failed to list documents")
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("failed to list documents"))
	}

	data := make([]documentsType, 0, len(documents))
	for _, d := range documents {
		data = append(data, documentsType{
			Document: d,
			Link:     fmt.Sprintf("%s/%s", s.cfg.AwsCloudfrontUrl, d.Key),
		})
	}

	return data, nil
}

func (s *service) deleteDocument(input deleteDocumentData) (*deleteDocumentResponse, error) {
	doc, err := s.repo.DeleteDocument(s.ctx, document_repository.DeleteDocumentParams{
		ID:     input.documentID,
		UserID: input.userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newDocumentHTTPError(http.StatusNotFound, errDocumentNotFound)
		}
		s.log.Error().Err(err).Str("document_id", input.documentID.String()).Str("user_id", input.userID.String()).Msg("failed to delete document")
		return nil, newDocumentHTTPError(http.StatusInternalServerError, errors.New("failed to delete document"))
	}

	if err := s.deleter.DeleteObject(s.ctx, doc.Key); err != nil {
		s.log.Error().Err(err).Str("key", doc.Key).Msg("failed to delete s3 object")
		return nil, newDocumentHTTPError(http.StatusBadGateway, errors.New("failed to delete s3 object"))
	}

	return &deleteDocumentResponse{Document: doc}, nil
}

func (s *service) rollbackDocumentCreate(userID uuid.UUID, documentID uuid.UUID, key string) {
	if _, err := s.repo.DeleteDocument(s.ctx, document_repository.DeleteDocumentParams{ID: documentID, UserID: userID}); err != nil {
		s.log.Warn().Err(err).Str("document_id", documentID.String()).Str("user_id", userID.String()).Msg("failed to rollback document row")
	}

	if err := s.deleter.DeleteObject(s.ctx, key); err != nil {
		s.log.Warn().Err(err).Str("key", key).Msg("failed to rollback s3 object")
	}
}
