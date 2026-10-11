package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type UUIDArray []uuid.UUID

func (a UUIDArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "{}", nil
	}
	var b strings.Builder
	b.WriteString("{")
	for i, u := range a {
		if i > 0 {
			b.WriteString(",")
		}
		b.WriteString(u.String())
	}
	b.WriteString("}")
	return b.String(), nil
}

func (a *UUIDArray) Scan(src interface{}) error {
	if src == nil {
		*a = UUIDArray{}
		return nil
	}
	var str string
	switch v := src.(type) {
	case string:
		str = v
	case []byte:
		str = string(v)
	default:
		return fmt.Errorf("failed to scan UUIDArray: unsupported type %T", src)
	}

	str = strings.Trim(str, "{}")
	if str == "" {
		*a = UUIDArray{}
		return nil
	}

	parts := strings.Split(str, ",")
	res := make(UUIDArray, 0, len(parts))
	for _, p := range parts {
		u, err := uuid.Parse(strings.TrimSpace(p))
		if err != nil {
			return err
		}
		res = append(res, u)
	}
	*a = res
	return nil
}

type Conversation struct {
	Id          uuid.UUID   `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	IsGroup     bool        `gorm:"not null" json:"isGroup"`
	GroupName   string      `gorm:"not null" json:"groupName"`
	GroupAvatar string      `gorm:"not null" json:"groupAvatar"`
	Description string      `gorm:"not null" json:"description"`
	MemberCount int         `gorm:"not null" json:"memberCount"`
	LastMessage string      `gorm:"not null" json:"lastMessage"`
	Tags        []string    `gorm:"serializer:json" json:"tags"`
	MemberIds   UUIDArray   `gorm:"type:uuid[];default:'{}'" json:"memberIds"`
	CreatedAt   time.Time   `json:"created_at" gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time   `json:"updated_at" gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
}
