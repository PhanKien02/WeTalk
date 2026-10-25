package client

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"time"
)

var ErrConversationNotFound = errors.New("conversation not found")

type Conversation struct {
	Id        string   `json:"id"`
	IsGroup   bool     `json:"isGroup"`
	MemberIds []string `json:"memberIds"`
}

func (c *Conversation) HasMember(userId string) bool {
	return slices.Contains(c.MemberIds, userId)
}

// ConversationClient calls the conversation service directly (not through the
// gateway), forwarding X-User-Id the same way the gateway would.
type ConversationClient interface {
	FindById(ctx context.Context, id, userId string) (*Conversation, error)
}

type conversationClient struct {
	baseURL string
	http    *http.Client
}

func NewConversationClient(baseURL string) ConversationClient {
	return &conversationClient{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *conversationClient) FindById(ctx context.Context, id, userId string) (*Conversation, error) {
	url := fmt.Sprintf("%s/api/v1/conversations/%s", c.baseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-User-Id", userId)

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		// The conversation service returns 500 for "record not found".
		return nil, ErrConversationNotFound
	}

	var body struct {
		Data Conversation `json:"data"`
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return nil, err
	}
	return &body.Data, nil
}
