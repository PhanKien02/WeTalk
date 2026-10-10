"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { userService } from "@/services/user.service";
import type { User } from "@/type";

const PAGE_SIZE = 10;

export interface UseFindUsersOptions {
  enabled?: boolean;
}

// Ensure fields from backend (whether uppercase or lowercase) map properly to User
function normalizeUser(u: Record<string, unknown>): User {
  return {
    id: (u.id || u.ID || "") as string,
    name: (u.name || u.Name || "") as string,
    email: (u.email || u.Email || "") as string,
    avatar: (u.avatar || u.Avatar || "") as string,
    phone: (u.phone || u.Phone || "") as string,
    bio: (u.bio || u.Bio || "") as string,
    location: (u.location || u.Location || "") as string,
    status: (u.status || "offline") as User["status"],
  };
}

export function useFindUsers(options: UseFindUsersOptions = { enabled: true }) {
  const { enabled = true } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const activeRequestIdRef = useRef(0);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch first page whenever debouncedQuery changes or modal opens
  const fetchInitial = useCallback(
    async (queryText: string) => {
      if (!enabled) return;

      const requestId = ++activeRequestIdRef.current;
      setIsLoading(true);
      setError(null);
      offsetRef.current = 0;

      try {
        const response = await userService.getAllUsers({
          limit: PAGE_SIZE,
          offset: 0,
          search: queryText.trim() || undefined,
        });

        // Ignore stale responses
        if (requestId !== activeRequestIdRef.current) return;

        const rawData = response.data || [];
        const normalized = rawData.map((u) => normalizeUser(u as unknown as Record<string, unknown>));
        setUsers(normalized);
        offsetRef.current = normalized.length;
        setHasMore(normalized.length === PAGE_SIZE);
      } catch (err: unknown) {
        if (requestId !== activeRequestIdRef.current) return;
        const msg = err instanceof Error ? err.message : "Failed to load users";
        setError(msg);
        setUsers([]);
        setHasMore(false);
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [enabled]
  );

  // Trigger initial fetch when enabled or debouncedQuery changes
  useEffect(() => {
    if (!enabled) return;

    let isSubscribed = true;
    const requestId = ++activeRequestIdRef.current;
    offsetRef.current = 0;

    const runFetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await userService.getAllUsers({
          limit: PAGE_SIZE,
          offset: 0,
          search: debouncedQuery.trim() || undefined,
        });

        if (!isSubscribed || requestId !== activeRequestIdRef.current) return;

        const rawData = response.data || [];
        const normalized = rawData.map((u) => normalizeUser(u as unknown as Record<string, unknown>));
        setUsers(normalized);
        offsetRef.current = normalized.length;
        setHasMore(normalized.length === PAGE_SIZE);
      } catch (err: unknown) {
        if (!isSubscribed || requestId !== activeRequestIdRef.current) return;
        const msg = err instanceof Error ? err.message : "Failed to load users";
        setError(msg);
        setUsers([]);
        setHasMore(false);
      } finally {
        if (isSubscribed && requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    void runFetch();

    return () => {
      isSubscribed = false;
    };
  }, [enabled, debouncedQuery]);

  // Fetch next page on scroll
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || isLoadingMore || !hasMore) return;

    const requestId = ++activeRequestIdRef.current;
    setIsLoadingMore(true);

    try {
      const currentOffset = offsetRef.current;
      const response = await userService.getAllUsers({
        limit: PAGE_SIZE,
        offset: currentOffset,
        search: debouncedQuery.trim() || undefined,
      });

      if (requestId !== activeRequestIdRef.current) return;

      const rawNewUsers = response.data || [];
      const newUsers = rawNewUsers.map((u) => normalizeUser(u as unknown as Record<string, unknown>));

      if (newUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map((u) => u.id));
          const uniqueNew = newUsers.filter((u) => !existingIds.has(u.id));
          return [...prev, ...uniqueNew];
        });
        offsetRef.current = currentOffset + newUsers.length;
        setHasMore(newUsers.length === PAGE_SIZE);
      }
    } catch (err: unknown) {
      if (requestId !== activeRequestIdRef.current) return;
      const msg = err instanceof Error ? err.message : "Failed to load more users";
      setError(msg);
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [enabled, isLoading, isLoadingMore, hasMore, debouncedQuery]);

  const refresh = useCallback(() => {
    fetchInitial(debouncedQuery);
  }, [fetchInitial, debouncedQuery]);

  return {
    users,
    searchQuery,
    setSearchQuery,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}
