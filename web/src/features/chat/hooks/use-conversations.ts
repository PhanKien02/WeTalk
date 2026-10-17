
"use client";

import conversationService from "@/services/conversation.service";
import type {
  ApiResponse,
  Conversation,
  QueryConversationsParams,
  RawConversation,
  Tag,
} from "@/type";
import { useQuery } from "@tanstack/react-query";

export function formatConversationTimestamp(isoString?: string): string {
  if (!isoString) return "Vừa xong";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const now = new Date();
  const diffMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 24 * 60 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isSameUser(nameA: string, nameB: string): boolean {
  const a = nameA.trim().toLowerCase();
  const b = nameB.trim().toLowerCase();
  if (a === b) return true;
  if (a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a))) {
    return true;
  }
  return false;
}

export function extractPartnerName(
  groupName?: string,
  currentUserName?: string
): string {
  if (!groupName) return "Cuộc trò chuyện";
  const trimmed = groupName.trim();
  if (!trimmed.includes(",")) return trimmed;

  let userName = currentUserName?.trim();
  if (!userName && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("wetalk_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        userName = parsed?.name?.trim();
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const names = trimmed
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length <= 1) return trimmed;

  if (userName) {
    const otherName = names.find((name) => !isSameUser(name, userName!));
    if (otherName) return otherName;
  }

  return names[names.length - 1] || trimmed;
}

export function normalizeConversation(
  raw: RawConversation,
  currentUserId?: string,
  currentUserName?: string
): Conversation {
  let effectiveUserId = currentUserId;
  let effectiveUserName = currentUserName;

  if ((!effectiveUserId || !effectiveUserName) && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("wetalk_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!effectiveUserId) effectiveUserId = parsed?.id;
        if (!effectiveUserName) effectiveUserName = parsed?.name;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // Với chat 1-1: groupName là tên 2 người ghép lại (vd: "PHAN DUC KIEN, TRAN QUANG HUY")
  // Khi hiển thị đối phương (user.name), trích xuất tên đối phương nếu có tên người dùng hiện tại
  const isDirect =
    raw.isGroup === false ||
    (Array.isArray(raw.tags) && raw.tags.includes("direct"));

  const partnerName = isDirect
    ? extractPartnerName(raw.groupName, effectiveUserName)
    : raw.groupName?.trim() || "Nhóm thảo luận";

  const displayName =
    partnerName ||
    raw.groupName?.trim() ||
    (raw.isGroup ? "Nhóm thảo luận" : "Cuộc trò chuyện");
  const fallbackAvatar = raw.isGroup
    ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop"
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop";
  const tags: Tag[] = Array.isArray(raw.tags)
    ? raw.tags.map((tag, index) => ({
        id: `tag-${raw.id}-${index}`,
        labelKey: tag,
        fallbackLabel: tag,
        tone: "orange",
      }))
    : [];

  // In direct chat, find the partner's user ID from memberIds
  let partnerUserId = raw.id;
  if (!raw.isGroup && Array.isArray(raw.memberIds)) {
    const other = effectiveUserId
      ? raw.memberIds.find((id) => id && id !== effectiveUserId)
      : raw.memberIds.find((id) => id && id !== raw.id);
    if (other) {
      partnerUserId = other;
    }
  }

  return {
    id: raw.id,
    user: {
      id: partnerUserId,
      name: displayName,
      avatar: raw.groupAvatar?.trim() || fallbackAvatar,
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
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const useGetConversations = (query: QueryConversationsParams) => {
  const {
    data: conversations,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiResponse<RawConversation[]>, Error>({
    queryKey: ["getConversations", { ...query }],
    queryFn: async () => {
      const response = await conversationService.getAllConversations(query);
      return response;
    },
    refetchOnWindowFocus: false,
    retry: 10,
    staleTime: 0,
  });

  return {
    conversations,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
};

export default useGetConversations;