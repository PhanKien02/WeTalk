"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import userService from "@/services/user.service";
import type { Conversation, User } from "@/type";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop";

function normalizeMember(u: Record<string, unknown>): User {
  const email = (u.email || u.Email || "") as string;
  const username =
    (u.username || u.Username || (email ? `@${email.split("@")[0]}` : undefined)) as
      | string
      | undefined;

  return {
    id: (u.id || u.ID || "") as string,
    name: (u.name || u.Name || "Người dùng") as string,
    email,
    avatar: (u.avatar || u.Avatar || DEFAULT_AVATAR) as string,
    phone: (u.phone || u.Phone || "") as string,
    bio: (u.bio || u.Bio || "") as string,
    location: (u.location || u.Location || "") as string,
    username,
    status: (u.status || "online") as User["status"],
  };
}

export function useConversationMembers(
  conversation?: Conversation | null
): {
  members: User[];
  partner: User | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { user: currentUser } = useAuth();
  const authUserId = currentUser?.id;
  const rawMemberIds = conversation?.memberIds;
  const conversationId = conversation?.id;
  const conversationUser = conversation?.user;
  const isGroup = conversation?.isGroup === true;

  const currentUserId = useMemo(() => {
    if (authUserId) return authUserId;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("wetalk_auth_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed?.id || null;
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return null;
  }, [authUserId]);

  const memberIds = useMemo(
    () => (Array.isArray(rawMemberIds) ? rawMemberIds.filter(Boolean) : []),
    [rawMemberIds]
  );

  const memberIdsKey = useMemo(() => memberIds.slice().sort().join(","), [memberIds]);

  // 1. Group Members Query: When conversation is a group
  const {
    data: fetchedGroupMembers,
    isLoading: isLoadingGroup,
    isError: isErrorGroup,
    error: errorGroup,
    refetch: refetchGroup,
  } = useQuery<User[], Error>({
    queryKey: ["conversationMembers", conversationId, memberIdsKey],
    queryFn: async () => {
      if (!memberIds.length) return [];

      const userMap = new Map<string, User>();

      // Populate current user immediately if they belong to this group
      if (currentUserId && memberIds.includes(currentUserId)) {
        userMap.set(currentUserId, {
          ...(currentUser || {}),
          id: currentUserId,
          name: currentUser?.name || "Bạn",
          avatar: currentUser?.avatar || DEFAULT_AVATAR,
          status: "online",
        });
      }

      // Batch fetch via userService.getAllUsers
      try {
        const response = await userService.getAllUsers({ ids: memberIds });
        const rawList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? (response as unknown as Record<string, unknown>[])
          : [];

        for (const raw of rawList) {
          const normalized = normalizeMember(raw as unknown as Record<string, unknown>);
          if (normalized.id) {
            userMap.set(normalized.id, normalized);
          }
        }
      } catch (batchErr) {
        console.warn("Batch fetch users failed, falling back to individual calls:", batchErr);
      }

      // Fetch any missing members individually via getUserById
      const missingIds = memberIds.filter((id) => !userMap.has(id));
      if (missingIds.length > 0) {
        const results = await Promise.allSettled(
          missingIds.map((id) => userService.getUserById(id))
        );

        for (const res of results) {
          if (res.status === "fulfilled" && res.value?.data) {
            const normalized = normalizeMember(
              res.value.data as unknown as Record<string, unknown>
            );
            if (normalized.id) {
              userMap.set(normalized.id, normalized);
            }
          }
        }
      }

      // Map back in memberIds order
      return memberIds.map((id) => {
        return (
          userMap.get(id) || {
            id,
            name: "Thành viên",
            avatar: DEFAULT_AVATAR,
            status: "offline",
          }
        );
      });
    },
    enabled: isGroup && memberIds.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // 2. Partner Profile Query: When conversation is 1-1 (direct)
  const partnerId = useMemo(() => {
    if (isGroup) return null;
    const fromMemberIds = memberIds.find((id) => id && id !== currentUserId);
    if (fromMemberIds) return fromMemberIds;
    if (
      conversationUser?.id &&
      conversationUser.id !== currentUserId &&
      conversationUser.id !== conversationId
    ) {
      return conversationUser.id;
    }
    return conversationUser?.id || null;
  }, [isGroup, memberIds, currentUserId, conversationUser?.id, conversationId]);

  const {
    data: partnerProfile,
    isLoading: isLoadingPartner,
    refetch: refetchPartner,
  } = useQuery<User | null, Error>({
    queryKey: ["partnerProfile", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      try {
        const response = await userService.getUserById(partnerId);
        if (response?.data) {
          return normalizeMember(
            response.data as unknown as Record<string, unknown>
          );
        }
      } catch (err) {
        console.warn("Failed to get partner profile:", err);
      }
      return null;
    },
    enabled: !isGroup && Boolean(partnerId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const activePartner = useMemo(() => {
    if (isGroup) return null;
    if (partnerProfile) {
      return {
        ...partnerProfile,
        name: partnerProfile.name || conversationUser?.name || "Người dùng",
        avatar: partnerProfile.avatar || conversationUser?.avatar || DEFAULT_AVATAR,
      };
    }
    return conversationUser || null;
  }, [isGroup, partnerProfile, conversationUser]);

  const members = useMemo(() => {
    if (!isGroup) {
      return activePartner ? [activePartner] : [];
    }
    if (fetchedGroupMembers && fetchedGroupMembers.length > 0) {
      return fetchedGroupMembers;
    }
    return conversationUser ? [conversationUser] : [];
  }, [isGroup, activePartner, fetchedGroupMembers, conversationUser]);

  return {
    members,
    partner: activePartner,
    isLoading: isGroup
      ? (memberIds.length > 0 ? isLoadingGroup : false)
      : (Boolean(partnerId) ? isLoadingPartner : false),
    isError: isGroup ? isErrorGroup : false,
    error: isGroup ? errorGroup : null,
    refetch: isGroup ? refetchGroup : refetchPartner,
  };
}

export default useConversationMembers;
