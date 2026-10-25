"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOCKET_EVENTS, useSocket } from "@/lib/socket";
import type { PresenceEvent, TypingEvent } from "@/type";

// Gửi lại "đang soạn" định kỳ khi vẫn gõ; bên nhận tự xóa nếu quá TYPING_EXPIRE_MS
// không nhận được gì (ví dụ người gõ mất mạng hoặc đóng tab).
const TYPING_IDLE_MS = 3000;
const TYPING_REFRESH_MS = 2000;
const TYPING_EXPIRE_MS = 5000;

interface JoinAck {
  ok: boolean;
  error?: string;
  onlineUserIds?: string[];
}

/**
 * Tham gia room conversation:<id> trên socket server khi cuộc hội thoại đang mở:
 * nhận "đang soạn tin" và trạng thái online của các thành viên.
 */
export function useConversationRoom(conversationId: string) {
  const { socket } = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [prevConversationId, setPrevConversationId] = useState(conversationId);

  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setOnlineUserIds(new Set());
    setTypingUserIds([]);
  }

  // Join khi socket kết nối (và mỗi lần kết nối lại, vì room mất theo socket cũ)
  useEffect(() => {
    if (!socket || !conversationId) return;

    const join = () => {
      socket.emit(
        SOCKET_EVENTS.CONVERSATION_JOIN,
        { conversationId },
        (res: JoinAck) => {
          if (res?.ok) {
            setOnlineUserIds(new Set(res.onlineUserIds ?? []));
          } else {
            console.warn("Không vào được room cuộc hội thoại:", res?.error);
          }
        }
      );
    };

    if (socket.connected) join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId });
    };
  }, [socket, conversationId]);

  // Nhận "đang soạn tin" và online/offline
  const expireTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    if (!socket) return;
    const timers = expireTimers.current;

    const stopTyping = (userId: string) => {
      clearTimeout(timers.get(userId));
      timers.delete(userId);
      setTypingUserIds((current) => current.filter((id) => id !== userId));
    };

    const onTyping = (event: TypingEvent) => {
      if (event.conversationId !== conversationId) return;
      if (!event.isTyping) {
        stopTyping(event.userId);
        return;
      }
      clearTimeout(timers.get(event.userId));
      timers.set(event.userId, setTimeout(() => stopTyping(event.userId), TYPING_EXPIRE_MS));
      setTypingUserIds((current) =>
        current.includes(event.userId) ? current : [...current, event.userId]
      );
    };

    const onPresence = (event: PresenceEvent) => {
      setOnlineUserIds((current) => {
        if (current.has(event.userId) === event.online) return current;
        const next = new Set(current);
        if (event.online) next.add(event.userId);
        else next.delete(event.userId);
        return next;
      });
      if (!event.online) stopTyping(event.userId);
    };

    socket.on(SOCKET_EVENTS.TYPING, onTyping);
    socket.on(SOCKET_EVENTS.PRESENCE, onPresence);
    return () => {
      socket.off(SOCKET_EVENTS.TYPING, onTyping);
      socket.off(SOCKET_EVENTS.PRESENCE, onPresence);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [socket, conversationId]);

  // Gửi "đang soạn tin" của mình
  const lastSentAt = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopTyping = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (!lastSentAt.current) return;
    lastSentAt.current = 0;
    socket?.emit(SOCKET_EVENTS.TYPING, { conversationId, isTyping: false });
  }, [socket, conversationId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentAt.current > TYPING_REFRESH_MS) {
      lastSentAt.current = now;
      socket?.emit(SOCKET_EVENTS.TYPING, { conversationId, isTyping: true });
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [socket, conversationId, stopTyping]);

  // Rời cuộc hội thoại khi đang gõ dở: báo dừng
  useEffect(() => stopTyping, [stopTyping]);

  return { onlineUserIds, typingUserIds, notifyTyping, stopTyping };
}
