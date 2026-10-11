"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { conversationService } from "@/services/conversation.service";
import type { Conversation, RawConversation, Tag, TagTone } from "@/type";

const PAGE_SIZE = 15;

export interface UseConversationsOptions {
  initialConversations?: Conversation[];
  enabled?: boolean;
}

function isRequestCanceled(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (
    (err as { name?: string }).name === "CanceledError" ||
    (err as { code?: string }).code === "ERR_CANCELED"
  );
}

function formatConversationTimestamp(isoString?: string): string {
  if (!isoString) return "Vừa xong";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Vừa xong";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24 && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Vừa xong";
  }
}

function normalizeConversation(raw: RawConversation): Conversation {
  const displayName =
    raw.groupName?.trim() ||
    (raw.isGroup ? "Nhóm thảo luận" : "Cuộc trò chuyện");

  const avatar =
    raw.groupAvatar?.trim() ||
    (raw.isGroup
      ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop"
      : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop");

  const tags: Tag[] = Array.isArray(raw.tags)
    ? raw.tags.map((t, idx) => ({
        id: `tag-${raw.id}-${idx}`,
        labelKey: t,
        fallbackLabel: t,
        tone: "orange" as TagTone,
      }))
    : [];

  return {
    id: raw.id,
    user: {
      id: raw.id,
      name: displayName,
      avatar,
      status: "online",
    },
    lastMessage: raw.lastMessage?.trim() || "Chưa có tin nhắn mới",
    timestamp: formatConversationTimestamp(raw.updated_at || raw.created_at),
    tags,
    isGroup: raw.isGroup,
    groupName: raw.groupName,
    groupAvatar: raw.groupAvatar,
    description: raw.description,
    memberCount: raw.memberCount,
    memberIds: raw.memberIds,
  };
}

export function useConversations({
  initialConversations = [],
  enabled = true,
}: UseConversationsOptions = {}) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const defaultListCacheRef = useRef<Conversation[]>(initialConversations);
  const activeAbortRef = useRef<AbortController | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    // Abort previous in-flight search or fetch request
    activeAbortRef.current?.abort();
    const controller = new AbortController();
    activeAbortRef.current = controller;

    const trimmedQuery = debouncedQuery.trim();
    offsetRef.current = 0;

    // Fast-path: When clearing search, instantly restore cached default list to prevent skeleton flicker
    if (!trimmedQuery && defaultListCacheRef.current.length > 0 && refreshIndex === 0) {
      setConversations(defaultListCacheRef.current);
      offsetRef.current = defaultListCacheRef.current.length;
    }

    const runFetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await conversationService.getAllConversations(
          {
            limit: PAGE_SIZE,
            offset: 0,
            textSearch: trimmedQuery || undefined,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        const rawList = response.data || [];
        const normalized = rawList.map(normalizeConversation);
        setConversations(normalized);

        // Cache initial/unfiltered conversations
        if (!trimmedQuery) {
          defaultListCacheRef.current = normalized;
        }

        setHasMore(rawList.length >= PAGE_SIZE);
        offsetRef.current = rawList.length;
      } catch (err: unknown) {
        if (controller.signal.aborted || isRequestCanceled(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách hội thoại";
        setError(msg);
        setConversations([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, enabled, refreshIndex]);

  const refetch = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !enabled) return;

    loadMoreAbortRef.current?.abort();
    const controller = new AbortController();
    loadMoreAbortRef.current = controller;

    setIsLoadingMore(true);
    const nextOffset = offsetRef.current;
    const trimmedQuery = debouncedQuery.trim();

    try {
      const response = await conversationService.getAllConversations(
        {
          limit: PAGE_SIZE,
          offset: nextOffset,
          textSearch: trimmedQuery || undefined,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      const rawList = response.data || [];
      const normalized = rawList.map(normalizeConversation);

      setConversations((prev) => {
        // Deduplicate in case overlapping items occur
        const existingIds = new Set(prev.map((c) => c.id));
        const uniqueNew = normalized.filter((c) => !existingIds.has(c.id));
        const merged = [...prev, ...uniqueNew];
        if (!trimmedQuery) {
          defaultListCacheRef.current = merged;
        }
        return merged;
      });

      offsetRef.current = nextOffset + rawList.length;
      setHasMore(rawList.length >= PAGE_SIZE);
    } catch (err: unknown) {
      if (controller.signal.aborted || isRequestCanceled(err)) return;
      console.error("Failed to load more conversations:", err);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoading, isLoadingMore, hasMore, enabled, debouncedQuery]);

  return {
    conversations,
    searchQuery,
    setSearchQuery,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
  };
}
