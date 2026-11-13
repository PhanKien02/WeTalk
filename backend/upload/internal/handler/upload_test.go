package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"upload/storage/r2"

	"github.com/gin-gonic/gin"
)

type storedObject struct {
	path, contentType, disposition, uploadedBy string
	body                                       []byte
}

// fakeR2 records PutObject requests the way R2 would receive them.
func fakeR2(t *testing.T) (*httptest.Server, func() []storedObject) {
	var mu sync.Mutex
	var objects []storedObject
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		objects = append(objects, storedObject{
			path:        r.URL.Path,
			contentType: r.Header.Get("Content-Type"),
			disposition: r.Header.Get("Content-Disposition"),
			uploadedBy:  r.Header.Get("X-Amz-Meta-Uploaded-By"),
			body:        body,
		})
		mu.Unlock()
		w.Header().Set("ETag", `"abc"`)
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(srv.Close)
	return srv, func() []storedObject {
		mu.Lock()
		defer mu.Unlock()
		return append([]storedObject(nil), objects...)
	}
}

func newRouter(endpoint string, maxSize int64) *gin.Engine {
	gin.SetMode(gin.TestMode)
	storage := r2.New(r2.Config{
		AccessKeyID:     "key",
		SecretAccessKey: "secret",
		Bucket:          "wetalk",
		PublicURL:       "https://cdn.example.com/",
		Endpoint:        endpoint,
	})
	r := gin.New()
	r.POST("/api/v1/upload", NewUploadHandler(storage, maxSize).Upload)
	return r
}

func multipartBody(t *testing.T, field, filename string, content []byte, extra map[string]string) (*bytes.Buffer, string) {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	for k, v := range extra {
		_ = w.WriteField(k, v)
	}
	if field != "" {
		fw, err := w.CreateFormFile(field, filename)
		if err != nil {
			t.Fatal(err)
		}
		fw.Write(content)
	}
	w.Close()
	return &buf, w.FormDataContentType()
}

// 1x1 transparent PNG.
var pngBytes = []byte{
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
	0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
	0x42, 0x60, 0x82,
}

func TestUploadStoresFileInR2(t *testing.T) {
	srv, stored := fakeR2(t)
	router := newRouter(srv.URL, 1<<20)

	body, ct := multipartBody(t, "file", "Ảnh đẹp.PNG", pngBytes, map[string]string{"folder": "avatars"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/upload", body)
	req.Header.Set("Content-Type", ct)
	req.Header.Set("X-User-Id", "user-1")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	var resp struct {
		Success bool         `json:"success"`
		Data    UploadResult `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	d := resp.Data
	if !resp.Success || !strings.HasPrefix(d.Key, "avatars/") || !strings.HasSuffix(d.Key, ".png") {
		t.Fatalf("unexpected result %+v", d)
	}
	if d.URL != "https://cdn.example.com/"+d.Key || d.ContentType != "image/png" || d.Size != int64(len(pngBytes)) {
		t.Fatalf("unexpected result %+v", d)
	}

	objs := stored()
	if len(objs) != 1 {
		t.Fatalf("stored %d objects, want 1", len(objs))
	}
	o := objs[0]
	if o.path != "/wetalk/"+d.Key {
		t.Errorf("path = %q", o.path)
	}
	if !bytes.Equal(o.body, pngBytes) {
		t.Errorf("stored body differs from upload (%d bytes)", len(o.body))
	}
	if o.contentType != "image/png" || !strings.HasPrefix(o.disposition, "inline") || o.uploadedBy != "user-1" {
		t.Errorf("headers: type=%q disposition=%q uploadedBy=%q", o.contentType, o.disposition, o.uploadedBy)
	}
}

func TestUploadHTMLIsServedAsAttachment(t *testing.T) {
	srv, stored := fakeR2(t)
	router := newRouter(srv.URL, 1<<20)

	body, ct := multipartBody(t, "file", "x.html", []byte("<html><script>alert(1)</script></html>"), nil)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/upload", body)
	req.Header.Set("Content-Type", ct)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	if objs := stored(); len(objs) != 1 || !strings.HasPrefix(objs[0].disposition, "attachment") {
		t.Fatalf("expected attachment disposition, got %+v", objs)
	}
}

func TestUploadRejectsBadRequests(t *testing.T) {
	srv, stored := fakeR2(t)
	router := newRouter(srv.URL, 1<<10) // 1 KiB limit

	cases := []struct {
		name   string
		field  string
		data   []byte
		extra  map[string]string
		status int
	}{
		{"missing file", "", nil, nil, http.StatusBadRequest},
		{"empty file", "file", []byte{}, nil, http.StatusBadRequest},
		{"too large", "file", bytes.Repeat([]byte("a"), 2<<10), nil, http.StatusRequestEntityTooLarge},
		{"way too large", "file", bytes.Repeat([]byte("a"), 3<<20), nil, http.StatusRequestEntityTooLarge},
		{"path traversal folder", "file", pngBytes, map[string]string{"folder": "../etc"}, http.StatusBadRequest},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body, ct := multipartBody(t, tc.field, "a.txt", tc.data, tc.extra)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/upload", body)
			req.Header.Set("Content-Type", ct)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)
			if rec.Code != tc.status {
				t.Fatalf("status = %d, want %d, body = %s", rec.Code, tc.status, rec.Body)
			}
		})
	}
	if n := len(stored()); n != 0 {
		t.Fatalf("stored %d objects, want 0", n)
	}
}
