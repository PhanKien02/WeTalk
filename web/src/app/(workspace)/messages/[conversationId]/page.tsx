"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
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

const WIDE_QUERY = "(min-width: 1280px)";

function subscribeWide(onChange: () => void) {
  const mql = window.matchMedia(WIDE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getWide = () => window.matchMedia(WIDE_QUERY).matches;
// Trên server chưa biết kích thước màn hình: coi là màn hình nhỏ (directory ẩn)
const getWideOnServer = () => false;

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

  // Tự động tạm ẩn directory khi màn hình nhỏ (< 1280px). Người dùng bật/tắt tay
  // thì giữ lựa chọn đó cho tới khi màn hình đổi qua lại mốc 1280px.
  // Mọi hook phải nằm trước các lệnh return sớm bên dưới (Rules of Hooks).
  const isWide = useSyncExternalStore(subscribeWide, getWide, getWideOnServer);
  const [directoryOverride, setDirectoryOverride] = useState<{
    isWide: boolean;
    collapsed: boolean;
  } | null>(null);
  const isDirectoryCollapsed =
    directoryOverride && directoryOverride.isWide === isWide
      ? directoryOverride.collapsed
      : !isWide;

  const handleToggleDirectory = useCallback(() => {
    setDirectoryOverride({ isWide, collapsed: !isDirectoryCollapsed });
  }, [isWide, isDirectoryCollapsed]);

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
