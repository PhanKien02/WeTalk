"use client";

import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useChatMessages } from "../../hooks/use-chat-messages";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";
import type { ChatPanelProps } from "@/type";

export function ChatPanel({
  conversation,
  members,
  typingUsers = [],
  onlineCount,
  onTyping,
  onStopTyping,
  isDirectoryOpen,
  onToggleDirectory,
}: ChatPanelProps) {
  const { user: currentUser } = useAuth();
  const { t } = useI18n();
  const {
    messages,
    sendMessage,
    retryMessage,
    loadMore,
    hasMore,
    isLoading,
    isLoadingMore,
    loadError,
    reads,
    scrollRef,
  } = useChatMessages(conversation);

  const typingNames = typingUsers.map((user) => user.name).join(", ");

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f111a] border-r border-border min-w-0 transition-colors">
      <ChatHeader
        user={conversation.user}
        isGroup={conversation.isGroup}
        memberCount={conversation.memberCount || members?.length}
        onlineCount={onlineCount}
        isDirectoryOpen={isDirectoryOpen}
        onToggleDirectory={onToggleDirectory}
      />
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
        reads={reads}
      />
      {/* Giữ chỗ cố định để khung chat không nhảy khi dòng này hiện/ẩn */}
      <div className="h-5 px-8 text-[12px] text-zinc-500 dark:text-zinc-400 italic truncate">
        {typingUsers.length > 0 &&
          `${typingNames} ${typingUsers.length > 1 ? t.typingMany : t.typingOne}`}
      </div>
      <MessageComposer
        onSendMessage={sendMessage}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
      />
    </div>
  );
}
