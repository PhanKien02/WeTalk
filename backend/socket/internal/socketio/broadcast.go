package socketio

import "slices"

// BroadcastOperator targets a set of sockets in a namespace, like
// `io.to("room").except("other").emit(...)` in socket.io. It is immutable:
// every modifier returns a new operator.
type BroadcastOperator struct {
	nsp    *Namespace
	rooms  []string
	except []string
}

// To targets the sockets in the given rooms (union with previous rooms).
func (b BroadcastOperator) To(rooms ...string) BroadcastOperator {
	b.rooms = append(slices.Clone(b.rooms), rooms...)
	return b
}

// In is an alias of To.
func (b BroadcastOperator) In(rooms ...string) BroadcastOperator {
	return b.To(rooms...)
}

// Except excludes the sockets in the given rooms.
func (b BroadcastOperator) Except(rooms ...string) BroadcastOperator {
	b.except = append(slices.Clone(b.except), rooms...)
	return b
}

// Emit sends an event to every targeted socket. The packet is encoded once.
func (b BroadcastOperator) Emit(event string, args ...any) error {
	if isReservedEvent(event) {
		return ErrReservedEvent
	}
	data, err := encodeEventData(event, args)
	if err != nil {
		return err
	}
	frame := packet{Type: packetEvent, Nsp: b.nsp.name, Data: data}.encode()
	for _, s := range b.Sockets() {
		s.conn.write(frame)
	}
	return nil
}

// SocketIDs returns the IDs of the targeted sockets.
func (b BroadcastOperator) SocketIDs() []string {
	return b.nsp.adapter.socketIDs(b.rooms, b.except)
}

// Sockets returns the targeted sockets that are still connected.
func (b BroadcastOperator) Sockets() []*Socket {
	ids := b.SocketIDs()

	b.nsp.mu.RLock()
	defer b.nsp.mu.RUnlock()

	sockets := make([]*Socket, 0, len(ids))
	for _, id := range ids {
		if s, ok := b.nsp.sockets[id]; ok {
			sockets = append(sockets, s)
		}
	}
	return sockets
}

// SocketsJoin makes the targeted sockets join the given rooms.
func (b BroadcastOperator) SocketsJoin(rooms ...string) {
	for _, s := range b.Sockets() {
		s.Join(rooms...)
	}
}

// SocketsLeave makes the targeted sockets leave the given room.
func (b BroadcastOperator) SocketsLeave(room string) {
	for _, s := range b.Sockets() {
		s.Leave(room)
	}
}

// DisconnectSockets disconnects the targeted sockets. When closeConn is true
// the underlying connection is closed as well.
func (b BroadcastOperator) DisconnectSockets(closeConn bool) {
	for _, s := range b.Sockets() {
		s.Disconnect(closeConn)
	}
}
