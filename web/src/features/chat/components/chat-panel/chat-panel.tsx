"use client";

import { useAuth } from "@/lib/auth";
import { useChatMessages } from "../../hooks/use-chat-messages";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";
import type { ChatPanelProps } from "@/type";

export function ChatPanel({ conversation, members }: ChatPanelProps) {
  const { user: currentUser } = useAuth();
  const {
    messages,
    sendMessage,
    retryMessage,
    loadMore,
    hasMore,
    isLoading,
    isLoadingMore,
    loadError,
    scrollRef,
  } = useChatMessages(conversation);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f111a] border-r border-border min-w-0 transition-colors">
      <ChatHeader user={conversation.user} />
      <MessageList
        messages={messages}
        otherUser={conversation.user}
        myUser={currentUser ?? undefined}
        members={members}
        scrollRef={scrollRef}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        loadError={loadError}
        onLoadMore={loadMore}
        onRetry={retryMessage}
      />
      <MessageComposer onSendMessage={sendMessage} />
    </div>
  );
}
