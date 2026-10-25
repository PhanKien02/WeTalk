package events

// Events sent to the browser. Keep in sync with SOCKET_EVENTS in web/src/lib/socket.
const (
	EventMessageCreated = "message:created"
	EventMessageUpdated = "message:updated"
	EventMessageDeleted = "message:deleted"
	EventMessageRead    = "message:read"

	EventConversationCreated = "conversation:created"
	EventConversationUpdated = "conversation:updated"
	EventConversationDeleted = "conversation:deleted"

	EventTyping   = "typing"
	EventPresence = "presence"
)

// Events received from the browser.
const (
	EventConversationJoin  = "conversation:join"
	EventConversationLeave = "conversation:leave"
)
