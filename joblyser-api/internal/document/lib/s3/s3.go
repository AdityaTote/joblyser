package s3

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3 struct {
	s3Client   *s3.Client
	bucketName string
}

func New(input S3Params) *S3 {
	client := s3.NewFromConfig(aws.Config{
		Region:      input.Region,
		Credentials: credentials.NewStaticCredentialsProvider(input.AccessKey, input.SecretKey, ""),
	})
	return &S3{
		s3Client:   client,
		bucketName: input.BucketName,
	}
}

func (s *S3) generateKey(fileName string) string {
	ext := strings.ToLower(filepath.Ext(fileName))
	name := strings.TrimSuffix(filepath.Base(fileName), ext)
	name = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "-"))

	timestamp := time.Now().UTC().Format("20060102T150405.000000000")
	return fmt.Sprintf("%s-%s%s", name, timestamp, ext)
}

func (s *S3) UploadToS3(ctx context.Context, filename string, contentType string, size int64, body io.Reader) (*string, error) {
	key := s.generateKey(filename)
	if _, err := s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        &s.bucketName,
		Key:           aws.String(key),
		Body:          body,
		ContentType:   aws.String(contentType),
		ContentLength: aws.Int64(size),
	}); err != nil {
		return nil, fmt.Errorf("PutObject failed: %w", err)
	}
	return &key, nil
}

func (s *S3) GetPresignedPutURL(ctx context.Context, filename string) (*PresignPutObjectResult, error) {
	presignClient := s3.NewPresignClient(s.s3Client)
	key := s.generateKey(filename)

	req, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucketName,
		Key:         aws.String(key),
		ContentType: aws.String("application/pdf"),
	})
	if err != nil {
		return nil, err
	}

	return &PresignPutObjectResult{
		URL: req.URL,
		Key: key,
	}, nil
}

func (s *S3) DeleteObject(ctx context.Context, key string) error {
	_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Key:    aws.String(key),
		Bucket: &s.bucketName,
	})
	if err != nil {
		return err
	}
	return nil
}
