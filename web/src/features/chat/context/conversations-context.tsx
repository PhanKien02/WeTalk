"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import type { Conversation, RawConversation } from "@/type";
import {
  normalizeConversation,
  useGetConversations,
} from "../hooks/use-conversations";

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
  const [conversations, setConversations] = useState(initialConversations);
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

  const conversationsState: ConversationsContextType = {
    conversations,
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
