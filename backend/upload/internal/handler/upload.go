package handler

import (
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"upload/pkg/response"
	"upload/storage/r2"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadResult is returned for each stored file.
type UploadResult struct {
	Key         string `json:"key"`
	URL         string `json:"url"`
	Name        string `json:"name"`
	Size        int64  `json:"size"`
	ContentType string `json:"contentType"`
}

type UploadHandler struct {
	storage *r2.Storage
	maxSize int64
}

func NewUploadHandler(storage *r2.Storage, maxSize int64) *UploadHandler {
	return &UploadHandler{storage: storage, maxSize: maxSize}
}

// Upload handles POST multipart/form-data with a single "file" field.
// The optional "folder" field groups objects (default "uploads").
func (h *UploadHandler) Upload(c *gin.Context) {
	// Leave 1 MiB for the multipart headers and other form fields.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxSize+1<<20)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			response.Error(c, http.StatusRequestEntityTooLarge, h.tooLargeMessage())
			return
		}
		response.Error(c, http.StatusBadRequest, "field \"file\" is required")
		return
	}
	if fileHeader.Size > h.maxSize {
		response.Error(c, http.StatusRequestEntityTooLarge, h.tooLargeMessage())
		return
	}
	if fileHeader.Size == 0 {
		response.Error(c, http.StatusBadRequest, "file is empty")
		return
	}

	folder, ok := cleanFolder(c.PostForm("folder"))
	if !ok {
		response.Error(c, http.StatusBadRequest, "folder may only contain letters, digits, '-', '_' and '/'")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()

	contentType, err := detectContentType(file, fileHeader.Filename)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	key := fmt.Sprintf("%s/%s/%s%s", folder, time.Now().UTC().Format("2006/01"), uuid.NewString(), ext)

	metadata := map[string]string{"original-name": fileHeader.Filename}
	if userID := c.GetHeader("X-User-Id"); userID != "" {
		metadata["uploaded-by"] = userID
	}

	url, err := h.storage.Upload(c.Request.Context(), r2.UploadInput{
		Key:                key,
		Body:               file,
		Size:               fileHeader.Size,
		ContentType:        contentType,
		ContentDisposition: contentDisposition(contentType, fileHeader.Filename),
		Metadata:           metadata,
	})
	if err != nil {
		log.Printf("upload failed: %v", err)
		response.Error(c, http.StatusBadGateway, "failed to store file")
		return
	}

	response.Created(c, UploadResult{
		Key:         key,
		URL:         url,
		Name:        fileHeader.Filename,
		Size:        fileHeader.Size,
		ContentType: contentType,
	})
}

func (h *UploadHandler) tooLargeMessage() string {
	return fmt.Sprintf("file is larger than %d MB", h.maxSize>>20)
}

// detectContentType sniffs the first 512 bytes, falls back to the file
// extension, then rewinds the file so it can be uploaded from the start.
func detectContentType(file io.ReadSeeker, filename string) (string, error) {
	head := make([]byte, 512)
	n, err := io.ReadFull(file, head)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
		return "", err
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	contentType := http.DetectContentType(head[:n])
	if contentType == "application/octet-stream" || strings.HasPrefix(contentType, "text/plain") {
		if byExt := mime.TypeByExtension(strings.ToLower(filepath.Ext(filename))); byExt != "" {
			contentType = byExt
		}
	}
	return contentType, nil
}

// contentDisposition lets browsers show media inline and forces a download
// for everything else, so uploaded HTML or SVG is never rendered from the bucket.
func contentDisposition(contentType, filename string) string {
	inline := (strings.HasPrefix(contentType, "image/") && contentType != "image/svg+xml") ||
		strings.HasPrefix(contentType, "video/") ||
		strings.HasPrefix(contentType, "audio/") ||
		contentType == "application/pdf"

	disposition := "attachment"
	if inline {
		disposition = "inline"
	}
	return mime.FormatMediaType(disposition, map[string]string{"filename": filename})
}

func cleanFolder(folder string) (string, bool) {
	folder = strings.Trim(folder, "/")
	if folder == "" {
		return "uploads", true
	}
	for _, r := range folder {
		ok := r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' ||
			r == '-' || r == '_' || r == '/'
		if !ok {
			return "", false
		}
	}
	if strings.Contains(folder, "//") || len(folder) > 64 {
		return "", false
	}
	return folder, true
}
