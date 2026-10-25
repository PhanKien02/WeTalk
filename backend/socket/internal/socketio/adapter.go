package socketio

import "sync"

// adapter keeps the room membership of a single namespace in memory.
// Every socket is automatically a member of the room named after its own ID.
type adapter struct {
	mu    sync.RWMutex
	rooms map[string]map[string]struct{} // room -> socket IDs
	sids  map[string]map[string]struct{} // socket ID -> rooms
}

func newAdapter() *adapter {
	return &adapter{
		rooms: make(map[string]map[string]struct{}),
		sids:  make(map[string]map[string]struct{}),
	}
}

func (a *adapter) addAll(id string, rooms ...string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.sids[id] == nil {
		a.sids[id] = make(map[string]struct{})
	}
	for _, room := range rooms {
		a.sids[id][room] = struct{}{}
		if a.rooms[room] == nil {
			a.rooms[room] = make(map[string]struct{})
		}
		a.rooms[room][id] = struct{}{}
	}
}

func (a *adapter) del(id, room string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	delete(a.sids[id], room)
	a.removeFromRoom(id, room)
}

func (a *adapter) delAll(id string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	for room := range a.sids[id] {
		a.removeFromRoom(id, room)
	}
	delete(a.sids, id)
}

func (a *adapter) removeFromRoom(id, room string) {
	members := a.rooms[room]
	if members == nil {
		return
	}
	delete(members, id)
	if len(members) == 0 {
		delete(a.rooms, room)
	}
}

func (a *adapter) socketRooms(id string) []string {
	a.mu.RLock()
	defer a.mu.RUnlock()

	rooms := make([]string, 0, len(a.sids[id]))
	for room := range a.sids[id] {
		rooms = append(rooms, room)
	}
	return rooms
}

// socketIDs returns the members of the given rooms (all sockets when rooms is
// empty), minus the members of the except rooms.
func (a *adapter) socketIDs(rooms, except []string) []string {
	a.mu.RLock()
	defer a.mu.RUnlock()

	excluded := make(map[string]struct{})
	for _, room := range except {
		for id := range a.rooms[room] {
			excluded[id] = struct{}{}
		}
	}

	seen := make(map[string]struct{})
	var ids []string
	add := func(id string) {
		if _, skip := excluded[id]; skip {
			return
		}
		if _, dup := seen[id]; dup {
			return
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}

	if len(rooms) == 0 {
		for id := range a.sids {
			add(id)
		}
		return ids
	}
	for _, room := range rooms {
		for id := range a.rooms[room] {
			add(id)
		}
	}
	return ids
}
