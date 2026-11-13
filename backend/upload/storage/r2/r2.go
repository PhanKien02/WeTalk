// Package r2 uploads files to Cloudflare R2 through its S3-compatible API.
package r2

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	PublicURL       string
	// Endpoint overrides the R2 endpoint, e.g. a local MinIO. Optional.
	Endpoint string
}

type Storage struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

// UploadInput describes one object to store.
type UploadInput struct {
	Key                string
	Body               io.Reader
	Size               int64
	ContentType        string
	ContentDisposition string
	Metadata           map[string]string
}

func New(cfg Config) *Storage {
	endpoint := cfg.Endpoint
	if endpoint == "" {
		endpoint = fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	}

	client := s3.New(s3.Options{
		Region:       "auto",
		BaseEndpoint: aws.String(endpoint),
		UsePathStyle: true,
		Credentials:  credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		// Newer SDK versions add CRC checksums to every request by default;
		// only send them when an operation requires it, as Cloudflare recommends for R2.
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})

	return &Storage{
		client:    client,
		bucket:    cfg.Bucket,
		publicURL: strings.TrimRight(cfg.PublicURL, "/"),
	}
}

// Upload stores the object and returns its public URL.
func (s *Storage) Upload(ctx context.Context, in UploadInput) (string, error) {
	input := &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(in.Key),
		Body:          in.Body,
		ContentLength: aws.Int64(in.Size),
		ContentType:   aws.String(in.ContentType),
		Metadata:      in.Metadata,
	}
	if in.ContentDisposition != "" {
		input.ContentDisposition = aws.String(in.ContentDisposition)
	}

	if _, err := s.client.PutObject(ctx, input); err != nil {
		return "", fmt.Errorf("r2 put object %q: %w", in.Key, err)
	}
	return s.URL(in.Key), nil
}

// Delete removes an object. Deleting a missing key is not an error.
func (s *Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("r2 delete object %q: %w", key, err)
	}
	return nil
}

// URL returns the public URL of a key.
func (s *Storage) URL(key string) string {
	segments := strings.Split(key, "/")
	for i, seg := range segments {
		segments[i] = url.PathEscape(seg)
	}
	return s.publicURL + "/" + strings.Join(segments, "/")
}
