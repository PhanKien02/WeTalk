package socketio

import (
	"bytes"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
)

// Engine.IO v4 packet types (first byte of every websocket frame).
const (
	eioOpen    = '0'
	eioClose   = '1'
	eioPing    = '2'
	eioPong    = '3'
	eioMessage = '4'
	eioUpgrade = '5'
	eioNoop    = '6'
)

// Socket.IO v5 packet types (carried inside an Engine.IO message packet).
type packetType byte

const (
	packetConnect packetType = iota
	packetDisconnect
	packetEvent
	packetAck
	packetConnectError
	packetBinaryEvent
	packetBinaryAck
)

var (
	errInvalidPacket     = errors.New("socketio: invalid packet")
	errBinaryUnsupported = errors.New("socketio: binary packets are not supported")
)

type packet struct {
	Type packetType
	Nsp  string
	ID   *uint64
	Data json.RawMessage
}

// encode returns the full Engine.IO frame, e.g. `42/chat,7["message",{"text":"hi"}]`.
func (p packet) encode() []byte {
	var b bytes.Buffer
	b.WriteByte(eioMessage)
	b.WriteByte('0' + byte(p.Type))
	if p.Nsp != "" && p.Nsp != "/" {
		b.WriteString(p.Nsp)
		b.WriteByte(',')
	}
	if p.ID != nil {
		b.WriteString(strconv.FormatUint(*p.ID, 10))
	}
	b.Write(p.Data)
	return b.Bytes()
}

// decodePacket parses a Socket.IO packet (the Engine.IO type byte already stripped).
func decodePacket(s string) (packet, error) {
	if s == "" || s[0] < '0' || s[0] > '6' {
		return packet{}, errInvalidPacket
	}
	p := packet{Type: packetType(s[0] - '0'), Nsp: "/"}
	if p.Type == packetBinaryEvent || p.Type == packetBinaryAck {
		return packet{}, errBinaryUnsupported
	}

	i := 1
	if i < len(s) && s[i] == '/' {
		if j := strings.IndexByte(s[i:], ','); j >= 0 {
			p.Nsp = s[i : i+j]
			i += j + 1
		} else {
			p.Nsp = s[i:]
			i = len(s)
		}
	}

	start := i
	for i < len(s) && s[i] >= '0' && s[i] <= '9' {
		i++
	}
	if i > start {
		id, err := strconv.ParseUint(s[start:i], 10, 64)
		if err != nil {
			return packet{}, errInvalidPacket
		}
		p.ID = &id
	}

	if i < len(s) {
		data := s[i:]
		if !json.Valid([]byte(data)) {
			return packet{}, errInvalidPacket
		}
		p.Data = json.RawMessage(data)
	}
	return p, nil
}

func encodeEventData(event string, args []any) (json.RawMessage, error) {
	return json.Marshal(append([]any{event}, args...))
}

func encodeAckData(args []any) (json.RawMessage, error) {
	if args == nil {
		args = []any{}
	}
	return json.Marshal(args)
}

func errorData(message string) json.RawMessage {
	data, _ := json.Marshal(map[string]string{"message": message})
	return data
}
