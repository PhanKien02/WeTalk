"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ChatPanel } from "@/features/chat/components/chat-panel/chat-panel";
import { DirectoryPanel } from "@/features/chat/components/directory/directory-panel";
import { ConversationThemeProvider } from "@/features/chat/context/conversation-theme-context";
import { useConversationsContext } from "@/features/chat/context/conversations-context";
import { normalizeConversation } from "@/features/chat/hooks/use-conversations";
import useGetConversation from "@/features/chat/hooks/use-get-conversation-by-id";
import useConversationMembers from "@/features/chat/hooks/use-conversation-members";
import { useConversationRoom } from "@/features/chat/hooks/use-conversation-room";
import type { User } from "@/type";

export default function ConversationPage() {
  const params = useParams();
  const conversationId =
    typeof params?.conversationId === "string" ? params.conversationId : "";
  const { user: currentUser } = useAuth();

  // 1. Instant access to cached conversation from sidebar context
  const { conversations } = useConversationsContext();
  const cachedConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  // 2. Fetch fresh details from API
  const {
    data: response,
    isLoading,
    isError,
  } = useGetConversation(conversationId);

  // 3. Normalize fetched conversation
  const remoteConversation = useMemo(() => {
    if (response?.data) {
      return normalizeConversation(
        response.data,
        currentUser?.id,
        currentUser?.name
      );
    }
    return null;
  }, [response, currentUser?.id, currentUser?.name]);

  const conversation = remoteConversation || cachedConversation;

  // 4. Fetch group members if group, or partner profile if 1-1
  const { members: fetchedMembers, partner, isLoading: isLoadingMembers } =
    useConversationMembers(conversation);

  // 5. Room realtime: online và "đang soạn tin"
  const { onlineUserIds, typingUserIds, notifyTyping, stopTyping } =
    useConversationRoom(conversationId);

  const members = useMemo(
    () =>
      fetchedMembers.map((member) => ({
        ...member,
        status: onlineUserIds.has(member.id) ? ("online" as const) : ("offline" as const),
      })),
    [fetchedMembers, onlineUserIds]
  );

  const effectiveConversation = useMemo(() => {
    if (!conversation) return null;
    if (!conversation.isGroup) {
      const user = partner
        ? {
            ...conversation.user,
            ...partner,
            name: partner.name || conversation.user.name,
            avatar: partner.avatar || conversation.user.avatar,
          }
        : conversation.user;
      return {
        ...conversation,
        user: {
          ...user,
          status: onlineUserIds.has(user.id) ? ("online" as const) : ("offline" as const),
        },
      };
    }
    return conversation;
  }, [conversation, partner, onlineUserIds]);

  const typingUsers = useMemo(
    () =>
      typingUserIds
        .map(
          (id): User | undefined =>
            members.find((member) => member.id === id) ??
            (effectiveConversation?.user.id === id ? effectiveConversation.user : undefined)
        )
        .filter((user): user is User => Boolean(user)),
    [typingUserIds, members, effectiveConversation]
  );

  // 6. Loading state: only show when we have NO cached conversation to display
  if (isLoading && !conversation) {
    return (
      <div className="flex flex-1 h-full items-center justify-center bg-white dark:bg-[#0f111a]">
        <span className="inline-flex items-center justify-center animate-spin text-primary">
          <Loader2 className="w-8 h-8" />
        </span>
      </div>
    );
  }

  // 7. If loading finished and still no conversation found, trigger notFound
  if (!isLoading && !conversation && (isError || (response && !response.data))) {
    notFound();
  }

  if (!conversation) {
    return null;
  }

  // Tự động tạm ẩn directory khi màn hình nhỏ (< 1280px) cho đến khi bật lại
  const [isDirectoryCollapsed, setIsDirectoryCollapsed] = useState<boolean>(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    setIsDirectoryCollapsed(!mql.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      // Khi màn hình chuyển sang nhỏ (< 1280px), tự động tạm ẩn
      if (!e.matches) {
        setIsDirectoryCollapsed(true);
      } else {
        // Khi mở rộng màn hình lớn (>= 1280px), khôi phục hiển thị
        setIsDirectoryCollapsed(false);
      }
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const handleToggleDirectory = useCallback(() => {
    setIsDirectoryCollapsed((prev) => !prev);
  }, []);

  const activeConversation = effectiveConversation || conversation;

  return (
    <ConversationThemeProvider conversationId={conversationId}>
      <div className="flex flex-1 h-full min-w-0 overflow-hidden relative">
        <ChatPanel
          conversation={activeConversation}
          members={members}
          typingUsers={typingUsers}
          onlineCount={onlineUserIds.size}
          onTyping={notifyTyping}
          onStopTyping={stopTyping}
          isDirectoryOpen={!isDirectoryCollapsed}
          onToggleDirectory={handleToggleDirectory}
        />
        <DirectoryPanel
          conversation={activeConversation}
          members={members}
          isLoadingMembers={isLoadingMembers}
          files={[]}
          isCollapsed={isDirectoryCollapsed}
          onToggleCollapse={handleToggleDirectory}
        />
      </div>
    </ConversationThemeProvider>
  );
}
