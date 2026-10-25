"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SOCKET_EVENTS, useSocket } from "@/lib/socket";
import { messageService } from "@/services/message.service";
import type { Conversation, Message, RawMessage } from "@/type";
import { useConversationsContext } from "../context/conversations-context";
import {
  formatMessageTime,
  mergeMessages,
  normalizeMessage,
  upsertMessage,
} from "../lib/message";

const PAGE_SIZE = 30;
// Cách đáy bao nhiêu px thì vẫn coi là đang xem tin mới nhất (tự cuộn khi có tin mới)
const NEAR_BOTTOM_PX = 120;
const IMAGE_UNSUPPORTED = "Chưa hỗ trợ gửi ảnh (chưa có dịch vụ tải ảnh lên)";

type PendingScroll =
  | { type: "bottom"; smooth: boolean }
  | { type: "preserve"; height: number; top: number };

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
}

/** base.service reject bằng body lỗi của API: { success, error: { message } } */
function errorMessage(err: unknown, fallback: string) {
  const message = (err as { error?: { message?: string } } | null)?.error?.message;
  return message || fallback;
}

function newClientId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatMessages(conversation: Conversation) {
  const conversationId = conversation.id;
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const { socket } = useSocket();
  const { applyMessage } = useConversationsContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Conversation đã tải xong trang đầu; khác conversationId nghĩa là đang tải
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [prevConversationId, setPrevConversationId] = useState(conversationId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<PendingScroll | null>(null);
  const loadingMoreRef = useRef(false);

  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setMessages([]);
    setHasMore(false);
    setLoadError(null);
  }

  // Cuộn sau khi DOM đã có tin nhắn mới, trước khi trình duyệt vẽ
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const pending = pendingScroll.current;
    if (!el || !pending) return;
    pendingScroll.current = null;

    if (pending.type === "bottom") {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: pending.smooth ? "smooth" : "auto",
      });
    } else {
      // Giữ nguyên vị trí đang xem khi chèn tin cũ lên trên
      el.scrollTop = el.scrollHeight - pending.height + pending.top;
    }
  }, [messages]);

  const fetchLatest = useCallback(
    async (signal?: AbortSignal) => {
      const res = await messageService.getMessages(
        { conversationId, limit: PAGE_SIZE },
        { signal }
      );
      return (res.data ?? [])
        .map((raw) => normalizeMessage(raw, currentUserId))
        .reverse();
    },
    [conversationId, currentUserId]
  );

  // 1. Trang tin nhắn mới nhất
  useEffect(() => {
    const controller = new AbortController();
    fetchLatest(controller.signal)
      .then((page) => {
        pendingScroll.current = { type: "bottom", smooth: false };
        setMessages((current) => mergeMessages(current, page));
        setHasMore(page.length === PAGE_SIZE);
        setLoadError(null);
        setLoadedFor(conversationId);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(err, "Không tải được tin nhắn"));
        setLoadedFor(conversationId);
      });
    return () => controller.abort();
  }, [conversationId, fetchLatest]);

  // 2. Tin nhắn cũ hơn (khi cuộn lên đầu)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    const oldest = messages.find((m) => m.createdAt)?.createdAt;
    if (!oldest) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const res = await messageService.getMessages({
        conversationId,
        limit: PAGE_SIZE,
        before: oldest,
      });
      const page = (res.data ?? [])
        .map((raw) => normalizeMessage(raw, currentUserId))
        .reverse();

      const el = scrollRef.current;
      if (el) {
        pendingScroll.current = {
          type: "preserve",
          height: el.scrollHeight,
          top: el.scrollTop,
        };
      }
      setMessages((current) => mergeMessages(current, page));
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      console.error("Lỗi khi tải tin nhắn cũ:", err);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [conversationId, currentUserId, hasMore, messages]);

  // 3. Realtime qua socket
  useEffect(() => {
    if (!socket) return;

    const onCreated = (raw: RawMessage) => {
      if (raw.conversationId !== conversationId) return;
      const message = normalizeMessage(raw, currentUserId);
      const el = scrollRef.current;
      if (message.isOwn || !el || isNearBottom(el)) {
        pendingScroll.current = { type: "bottom", smooth: true };
      }
      setMessages((current) => upsertMessage(current, message));
    };

    const onUpdated = (raw: RawMessage) => {
      if (raw.conversationId !== conversationId) return;
      setMessages((current) =>
        current.some((m) => m.id === raw.id)
          ? upsertMessage(current, normalizeMessage(raw, currentUserId))
          : current
      );
    };

    const onDeleted = (raw: RawMessage) => {
      if (raw.conversationId !== conversationId) return;
      setMessages((current) => current.filter((m) => m.id !== raw.id));
    };

    // Bù các tin nhắn bị lỡ trong lúc socket mất kết nối
    const onConnect = () => {
      fetchLatest()
        .then((page) => setMessages((current) => mergeMessages(current, page)))
        .catch(() => {});
    };

    socket.on(SOCKET_EVENTS.MESSAGE_CREATED, onCreated);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, onUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
    socket.on("connect", onConnect);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_CREATED, onCreated);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, onUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
      socket.off("connect", onConnect);
    };
  }, [socket, conversationId, currentUserId, fetchLatest]);

  // 4. Gửi tin nhắn (optimistic, khớp với server qua clientId)
  const markFailed = useCallback((clientId: string, error: string) => {
    setMessages((current) =>
      current.map((m) =>
        m.clientId === clientId ? { ...m, status: "failed", error } : m
      )
    );
  }, []);

  const deliver = useCallback(
    async (message: Message) => {
      const clientId = message.clientId!;
      try {
        const res = await messageService.sendMessage({
          conversationId,
          content: message.content,
          clientId,
        });
        if (res.data) {
          setMessages((current) =>
            upsertMessage(current, normalizeMessage(res.data!, currentUserId))
          );
          applyMessage(res.data);
        }
      } catch (err) {
        markFailed(clientId, errorMessage(err, "Gửi tin nhắn thất bại"));
      }
    },
    [applyMessage, conversationId, currentUserId, markFailed]
  );

  const sendMessage = useCallback(
    (content: string, images?: string[]) => {
      const text = content.trim();
      if (!text && !images?.length) return;

      const clientId = newClientId();
      const optimistic: Message = {
        id: clientId,
        clientId,
        conversationId,
        senderId: currentUserId || "me",
        content: text,
        images: images?.length ? images : undefined,
        timestamp: formatMessageTime(),
        isOwn: true,
        status: "sending",
      };

      pendingScroll.current = { type: "bottom", smooth: true };
      setMessages((current) => [...current, optimistic]);

      // Ảnh trong composer là blob: URL chỉ tồn tại trên máy này, gửi lên sẽ vô dụng
      if (optimistic.images) {
        markFailed(clientId, IMAGE_UNSUPPORTED);
        return;
      }
      void deliver(optimistic);
    },
    [conversationId, currentUserId, deliver, markFailed]
  );

  const retryMessage = useCallback(
    (message: Message) => {
      if (!message.clientId || message.images?.length) return;
      setMessages((current) =>
        current.map((m) =>
          m.clientId === message.clientId
            ? { ...m, status: "sending", error: undefined }
            : m
        )
      );
      void deliver(message);
    },
    [deliver]
  );

  return {
    messages,
    sendMessage,
    retryMessage,
    loadMore,
    hasMore,
    isLoading: loadedFor !== conversationId,
    isLoadingMore,
    loadError,
    scrollRef,
  };
}
