import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupMessages } from "../../lib/group-messages";
import { MessageGroup } from "./message-group";
import { useConversationTheme } from "../../context/conversation-theme-context";
import type { MessageListProps } from "@/type";

// Cách đỉnh bao nhiêu px thì bắt đầu tải tin nhắn cũ hơn
const LOAD_MORE_THRESHOLD_PX = 80;

export function MessageList({
  messages,
  otherUser,
  myUser,
  members,
  scrollRef,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  onLoadMore,
  onRetry,
}: MessageListProps) {
  const groups = groupMessages(messages);
  const { currentPreset } = useConversationTheme();

  const membersById = useMemo(
    () => new Map((members ?? []).map((member) => [member.id, member])),
    [members]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (
      hasMore &&
      !isLoadingMore &&
      e.currentTarget.scrollTop < LOAD_MORE_THRESHOLD_PX
    ) {
      onLoadMore?.();
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto px-8 py-6 flex flex-col justify-start select-text transition-all duration-300 relative",
        currentPreset.className
      )}
      style={currentPreset.style}
    >
      {isLoadingMore && (
        <div className="flex justify-center py-2 text-primary">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {isLoading && messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-primary">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      ) : loadError && messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          {loadError}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          Chưa có tin nhắn nào. Hãy gửi lời chào!
        </div>
      ) : null}

      {groups.map((group) => (
        <MessageGroup
          key={group.messages[0].id}
          group={group}
          otherUser={membersById.get(group.senderId) ?? otherUser}
          myUser={myUser}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}
