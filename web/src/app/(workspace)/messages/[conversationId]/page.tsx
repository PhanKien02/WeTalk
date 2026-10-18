"use client";

import { useMemo } from "react";
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
  const { members, partner, isLoading: isLoadingMembers } =
    useConversationMembers(conversation);

  const effectiveConversation = useMemo(() => {
    if (!conversation) return null;
    if (!conversation.isGroup && partner) {
      return {
        ...conversation,
        user: {
          ...conversation.user,
          ...partner,
          name: partner.name || conversation.user.name,
          avatar: partner.avatar || conversation.user.avatar,
        },
      };
    }
    return conversation;
  }, [conversation, partner]);

  // 5. Loading state: only show when we have NO cached conversation to display
  if (isLoading && !conversation) {
    return (
      <div className="flex flex-1 h-full items-center justify-center bg-white dark:bg-[#0f111a]">
        <span className="inline-flex items-center justify-center animate-spin text-primary">
          <Loader2 className="w-8 h-8" />
        </span>
      </div>
    );
  }

  // 6. If loading finished and still no conversation found, trigger notFound
  if (!isLoading && !conversation && (isError || (response && !response.data))) {
    notFound();
  }

  if (!conversation) {
    return null;
  }

  const activeConversation = effectiveConversation || conversation;

  return (
    <ConversationThemeProvider conversationId={conversationId}>
      <div className="flex flex-1 h-full min-w-0 overflow-hidden">
        <ChatPanel conversation={activeConversation} initialMessages={[]} />
        <DirectoryPanel
          conversation={activeConversation}
          members={members}
          isLoadingMembers={isLoadingMembers}
          files={[]}
        />
      </div>
    </ConversationThemeProvider>
  );
}
