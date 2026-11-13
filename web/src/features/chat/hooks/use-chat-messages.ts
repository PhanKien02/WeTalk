"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SOCKET_EVENTS, useSocket } from "@/lib/socket";
import { messageService } from "@/services/message.service";
import { uploadService } from "@/services/upload.service";
import type { ComposerImage, Conversation, Message, MessageRead, RawMessage } from "@/type";
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
const UPLOAD_FOLDER = "messages";

/** Ảnh của một tin nhắn đang gửi. Giữ lại khi lỗi để "Thử lại" chỉ tải lên ảnh còn thiếu. */
interface PendingUpload {
  files: File[];
  previews: string[];
  /** URL trên R2 của từng ảnh; undefined nếu chưa tải lên xong */
  uploaded: (string | undefined)[];
}

function revokePreviews(pending: PendingUpload) {
  pending.previews.forEach((url) => URL.revokeObjectURL(url));
}

/** Tải lên song song các ảnh chưa có URL. Ảnh thành công được ghi lại kể cả khi ảnh khác lỗi. */
async function uploadPending(pending: PendingUpload): Promise<string[]> {
  await Promise.all(
    pending.files.map(async (file, i) => {
      if (pending.uploaded[i]) return;
      const res = await uploadService.uploadFile(file, { folder: UPLOAD_FOLDER });
      if (!res.data?.url) throw new Error("Upload service không trả về URL");
      pending.uploaded[i] = res.data.url;
    })
  );
  return pending.uploaded as string[];
}

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

function isNewerRead(read: MessageRead, current?: MessageRead) {
  return !current || Date.parse(read.lastReadAt) > Date.parse(current.lastReadAt);
}

function newClientId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatMessages(conversation: Conversation) {
  const conversationId = conversation.id;
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const { socket } = useSocket();
  const { applyMessage, markConversationRead } = useConversationsContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Conversation đã tải xong trang đầu; khác conversationId nghĩa là đang tải
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  // Vị trí đã đọc của từng thành viên, theo userId
  const [reads, setReads] = useState<Record<string, MessageRead>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<PendingScroll | null>(null);
  const loadingMoreRef = useRef(false);
  // Ảnh của các tin nhắn đang gửi hoặc gửi lỗi, theo clientId
  const uploadsRef = useRef(new Map<string, PendingUpload>());
  // Conversation đang mở, để kết quả gửi muộn không bị chèn vào conversation khác
  const conversationRef = useRef(conversationId);

  useEffect(() => {
    conversationRef.current = conversationId;
    const uploads = uploadsRef.current;
    // Rời conversation (hoặc unmount): tin nhắn lỗi không còn hiển thị, thu hồi ảnh xem trước
    return () => {
      uploads.forEach(revokePreviews);
      uploads.clear();
    };
  }, [conversationId]);

  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setMessages([]);
    setHasMore(false);
    setLoadError(null);
    setReads({});
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

  // 1b. Ai đã xem tới đâu
  useEffect(() => {
    let cancelled = false;
    messageService
      .getReads(conversationId)
      .then((res) => {
        if (cancelled) return;
        const byUser: Record<string, MessageRead> = {};
        for (const read of res.data ?? []) byUser[read.userId] = read;
        setReads(byUser);
      })
      .catch((err) => console.warn("Không tải được trạng thái đã xem:", err));
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // 1c. Đánh dấu đã đọc tin mới nhất của người khác, khi tab đang hiển thị
  const lastMarkedRef = useRef<string | null>(null);
  useEffect(() => {
    let latest: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.isOwn && m.createdAt) {
        latest = m;
        break;
      }
    }

    const mark = () => {
      if (document.visibilityState !== "visible") return;
      markConversationRead(conversationId);
      if (!latest || lastMarkedRef.current === latest.id) return;
      const messageId = latest.id;
      lastMarkedRef.current = messageId;
      messageService.markRead(conversationId, messageId).catch((err) => {
        lastMarkedRef.current = null;
        console.warn("Không đánh dấu đã đọc được:", err);
      });
    };

    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [messages, conversationId, markConversationRead]);

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

    const onRead = (read: MessageRead) => {
      if (read.conversationId !== conversationId) return;
      setReads((current) =>
        isNewerRead(read, current[read.userId])
          ? { ...current, [read.userId]: read }
          : current
      );
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
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onRead);
    socket.on("connect", onConnect);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onRead);
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
      const pending = uploadsRef.current.get(clientId);
      const isCurrent = () => conversationRef.current === conversationId;

      let images: string[] | undefined;
      if (pending) {
        try {
          images = await uploadPending(pending);
        } catch (err) {
          if (isCurrent()) markFailed(clientId, errorMessage(err, "Tải ảnh lên thất bại"));
          return;
        }
      }

      try {
        const res = await messageService.sendMessage({
          conversationId,
          content: message.content,
          images,
          clientId,
        });
        if (res.data) {
          if (isCurrent()) {
            setMessages((current) =>
              upsertMessage(current, normalizeMessage(res.data!, currentUserId))
            );
          }
          applyMessage(res.data);
        }
        // Tin nhắn giờ dùng URL trên R2, không cần ảnh xem trước nữa
        if (pending) {
          uploadsRef.current.delete(clientId);
          revokePreviews(pending);
        }
      } catch (err) {
        if (isCurrent()) markFailed(clientId, errorMessage(err, "Gửi tin nhắn thất bại"));
      }
    },
    [applyMessage, conversationId, currentUserId, markFailed]
  );

  const sendMessage = useCallback(
    (content: string, images?: ComposerImage[]) => {
      const text = content.trim();
      if (!text && !images?.length) return;

      const clientId = newClientId();
      const previews = images?.map((img) => img.previewUrl) ?? [];
      if (images?.length) {
        uploadsRef.current.set(clientId, {
          files: images.map((img) => img.file),
          previews,
          uploaded: images.map(() => undefined),
        });
      }

      const optimistic: Message = {
        id: clientId,
        clientId,
        conversationId,
        senderId: currentUserId || "me",
        content: text,
        images: previews.length ? previews : undefined,
        timestamp: formatMessageTime(),
        isOwn: true,
        status: "sending",
      };

      pendingScroll.current = { type: "bottom", smooth: true };
      setMessages((current) => [...current, optimistic]);
      void deliver(optimistic);
    },
    [conversationId, currentUserId, deliver]
  );

  const retryMessage = useCallback(
    (message: Message) => {
      if (!message.clientId) return;
      // Tin có ảnh chỉ gửi lại được khi còn giữ file gốc
      if (message.images?.length && !uploadsRef.current.has(message.clientId)) return;
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
    reads,
    scrollRef,
  };
}
