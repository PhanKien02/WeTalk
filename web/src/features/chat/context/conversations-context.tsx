"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { SOCKET_EVENTS, useSocket } from "@/lib/socket";
import { messageService } from "@/services/message.service";
import type {
  Conversation,
  MessageRead,
  RawConversation,
  RawMessage,
} from "@/type";
import {
  formatConversationTimestamp,
  normalizeConversation,
  useGetConversations,
} from "../hooks/use-conversations";
import { messagePreview } from "../lib/message";

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 300;
const EMPTY_CONVERSATIONS: Conversation[] = [];

export interface ConversationsContextType {
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refetch: () => void;
  addOrUpdateConversation: (conv: Conversation) => void;
  replaceConversationId: (oldId: string, updated: Conversation) => void;
  /** Cập nhật tin nhắn cuối và đưa cuộc hội thoại lên đầu danh sách */
  applyMessage: (message: RawMessage) => void;
  /** Đặt số tin chưa đọc của cuộc hội thoại về 0 */
  markConversationRead: (conversationId: string) => void;
}

const ConversationsContext = createContext<ConversationsContextType | null>(null);

export function ConversationsProvider({
  children,
  initialConversations = EMPTY_CONVERSATIONS,
}: {
  children: React.ReactNode;
  initialConversations?: Conversation[];
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ConversationsStateProvider initialConversations={initialConversations}>
        {children}
      </ConversationsStateProvider>
    </QueryClientProvider>
  );
}

function ConversationsStateProvider({
  children,
  initialConversations,
}: {
  children: React.ReactNode;
  initialConversations: Conversation[];
}) {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name;
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const activeConversationId =
    typeof params?.conversationId === "string" ? params.conversationId : null;
  const [conversations, setConversations] = useState(initialConversations);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        const nextSearchQuery = searchQuery.trim();
        if (nextSearchQuery === debouncedSearchQuery) return;

        setPage(0);
        setConversations(initialConversations);
        setHasMore(true);
        setError(null);
        setDebouncedSearchQuery(nextSearchQuery);
      },
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [debouncedSearchQuery, initialConversations, searchQuery]);

  const {
    conversations: response,
    isLoading,
    isError,
    error: queryError,
    refetch: refetchQuery,
    isFetching,
  } = useGetConversations({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    textSearch: debouncedSearchQuery || undefined,
  });

  /* eslint-disable react-hooks/set-state-in-effect -- Query results synchronize paginated context state. */
  useEffect(() => {
    if (isError && queryError) {
      setError(queryError.message);
      return;
    }
    if (!response) return;
    if (response.success === false || (response.error && !response.data)) {
      setError(response.error?.message ?? "Failed to load conversations");
      return;
    }

    const rawConversations: RawConversation[] = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response)
        ? (response as unknown as RawConversation[])
        : [];
    const normalized = rawConversations.map((raw) =>
      normalizeConversation(raw, currentUserId, currentUserName)
    );

    if (page === 0) {
      setConversations(normalized);
      setHasMore(rawConversations.length === PAGE_SIZE && rawConversations.length > 0);
    } else {
      setConversations((current) => {
        const existingIds = new Set(
          current.map((conversation) => conversation.id),
        );
        const newItems = normalized.filter(
          (conversation) => !existingIds.has(conversation.id),
        );
        if (newItems.length === 0) {
          setHasMore(false);
          return current;
        }
        return [...current, ...newItems];
      });
      setHasMore(rawConversations.length === PAGE_SIZE && rawConversations.length > 0);
    }
    setError(null);
  }, [currentUserId, currentUserName, isError, page, queryError, response]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetching || isLoading) return;
    setPage((currentPage) => currentPage + 1);
  }, [hasMore, isFetching, isLoading]);

  const refetch = useCallback(() => {
    if (page !== 0) {
      setPage(0);
      return;
    }
    void refetchQuery();
  }, [page, refetchQuery]);

  const addOrUpdateConversation = useCallback((conversation: Conversation) => {
    setConversations((current) => {
      const existingIndex = current.findIndex(
        (item) => item.id === conversation.id,
      );
      if (existingIndex === -1) return [conversation, ...current];

      const updated = [...current];
      updated[existingIndex] = conversation;
      return updated;
    });
  }, []);

  const replaceConversationId = useCallback(
    (oldId: string, updatedConversation: Conversation) => {
      setConversations((current) => {
        const oldIndex = current.findIndex((item) => item.id === oldId);
        const newIndex = current.findIndex(
          (item) => item.id === updatedConversation.id,
        );
        let insertIndex = oldIndex;
        if (oldIndex === -1) {
          insertIndex = Math.max(newIndex, 0);
        } else if (newIndex !== -1 && newIndex < oldIndex) {
          insertIndex = oldIndex - 1;
        }
        const next = current.filter(
          (item) =>
            item.id !== oldId && item.id !== updatedConversation.id,
        );
        next.splice(Math.min(insertIndex, next.length), 0, updatedConversation);
        return next;
      });
    },
    [],
  );

  const applyMessage = useCallback((message: RawMessage) => {
    setConversations((current) => {
      const index = current.findIndex(
        (item) => item.id === message.conversationId,
      );
      if (index === -1) return current;

      const conversation = current[index];
      const updated: Conversation = {
        ...conversation,
        lastMessage: messagePreview(message) || conversation.lastMessage,
        timestamp: formatConversationTimestamp(message.created_at),
        updated_at: message.created_at,
      };
      return [updated, ...current.filter((_, i) => i !== index)];
    });
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setUnreadCounts((current) =>
      current[conversationId] ? { ...current, [conversationId]: 0 } : current
    );
  }, []);

  const { socket } = useSocket();
  const conversationsRef = useRef(conversations);
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    conversationsRef.current = conversations;
    activeConversationIdRef.current = activeConversationId;
  }, [conversations, activeConversationId]);

  // Số tin chưa đọc: tải khi vào trang và mỗi lần socket (kết nối lại) để bù event bị lỡ
  useEffect(() => {
    if (!currentUserId) return;
    const loadUnreadCounts = () => {
      messageService
        .getUnreadCounts()
        .then((res) => {
          const counts: Record<string, number> = {};
          for (const item of res.data ?? []) counts[item.conversationId] = item.count;
          // Cuộc hội thoại đang mở đã được đọc
          if (activeConversationIdRef.current) delete counts[activeConversationIdRef.current];
          setUnreadCounts(counts);
        })
        .catch((err) => console.warn("Không tải được số tin chưa đọc:", err));
    };
    loadUnreadCounts();
    socket?.on("connect", loadUnreadCounts);
    return () => {
      socket?.off("connect", loadUnreadCounts);
    };
  }, [currentUserId, socket]);

  // Event realtime cho sidebar
  useEffect(() => {
    if (!socket) return;

    // Nếu là cuộc hội thoại chưa có trong danh sách (người khác vừa nhắn cho
    // mình lần đầu) thì tải lại danh sách để lấy nó về.
    const onMessageCreated = (message: RawMessage) => {
      const known = conversationsRef.current.some(
        (item) => item.id === message.conversationId,
      );
      if (known) {
        applyMessage(message);
      } else {
        refetch();
      }
      if (
        message.senderId !== currentUserId &&
        message.conversationId !== activeConversationIdRef.current
      ) {
        setUnreadCounts((current) => ({
          ...current,
          [message.conversationId]: (current[message.conversationId] ?? 0) + 1,
        }));
      }
    };

    // Mình đọc ở tab/thiết bị khác
    const onMessageRead = (read: MessageRead) => {
      if (read.userId === currentUserId) markConversationRead(read.conversationId);
    };

    // Nhóm mới, đổi thông tin nhóm, thêm/bớt thành viên
    const onConversationUpserted = (raw: RawConversation) => {
      addOrUpdateConversation(
        normalizeConversation(raw, currentUserId, currentUserName),
      );
      void queryClient.invalidateQueries({ queryKey: ["getConversationById", raw.id] });
      void queryClient.invalidateQueries({ queryKey: ["conversationMembers", raw.id] });
    };

    // Nhóm bị xóa hoặc mình bị xóa khỏi nhóm
    const onConversationDeleted = (raw: RawConversation) => {
      setConversations((current) => current.filter((item) => item.id !== raw.id));
      setUnreadCounts((current) => {
        if (!(raw.id in current)) return current;
        const next = { ...current };
        delete next[raw.id];
        return next;
      });
      queryClient.removeQueries({ queryKey: ["getConversationById", raw.id] });
      if (activeConversationIdRef.current === raw.id) router.replace("/messages");
    };

    socket.on(SOCKET_EVENTS.MESSAGE_CREATED, onMessageCreated);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
    socket.on(SOCKET_EVENTS.CONVERSATION_CREATED, onConversationUpserted);
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, onConversationUpserted);
    socket.on(SOCKET_EVENTS.CONVERSATION_DELETED, onConversationDeleted);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_CREATED, onMessageCreated);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
      socket.off(SOCKET_EVENTS.CONVERSATION_CREATED, onConversationUpserted);
      socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED, onConversationUpserted);
      socket.off(SOCKET_EVENTS.CONVERSATION_DELETED, onConversationDeleted);
    };
  }, [
    socket,
    currentUserId,
    currentUserName,
    queryClient,
    router,
    applyMessage,
    addOrUpdateConversation,
    markConversationRead,
    refetch,
  ]);

  const conversationsWithUnread = useMemo(
    () =>
      conversations.map((conversation) => {
        const unreadCount = unreadCounts[conversation.id] ?? 0;
        // Giữ nguyên object khi không đổi để ConversationItem (memo) không render lại
        return (conversation.unreadCount ?? 0) === unreadCount
          ? conversation
          : { ...conversation, unreadCount };
      }),
    [conversations, unreadCounts],
  );

  const conversationsState: ConversationsContextType = {
    conversations: conversationsWithUnread,
    searchQuery,
    setSearchQuery,
    isLoading: page === 0 && isLoading,
    isLoadingMore: page > 0 && isFetching,
    hasMore,
    error,
    loadMore,
    refetch,
    addOrUpdateConversation,
    replaceConversationId,
    applyMessage,
    markConversationRead,
  };

  return (
    <ConversationsContext.Provider value={conversationsState}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext(): ConversationsContextType {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error(
      "useConversationsContext must be used within a ConversationsProvider"
    );
  }
  return context;
}
