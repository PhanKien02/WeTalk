import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupMessages } from "../../lib/group-messages";
import { MessageGroup } from "./message-group";
import { useConversationTheme } from "../../context/conversation-theme-context";
import type { Message, MessageRead, User } from "@/type";
import type { MessageListProps } from "@/type";

// Cách đỉnh bao nhiêu px thì bắt đầu tải tin nhắn cũ hơn
const LOAD_MORE_THRESHOLD_PX = 80;

/**
 * Đặt mỗi người đã xem dưới tin nhắn mới nhất họ đã đọc. Tin của chính họ coi
 * như đã đọc; nếu vị trí rơi vào tin của chính họ thì không hiện (thừa).
 */
function placeReaders(
  messages: Message[],
  reads: Record<string, MessageRead>,
  myUserId: string | undefined,
  findUser: (id: string) => User | undefined
): Map<string, User[]> {
  const byMessage = new Map<string, User[]>();
  for (const read of Object.values(reads)) {
    if (read.userId === myUserId) continue;
    const readAt = Date.parse(read.lastReadAt);

    let position: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.createdAt && (Date.parse(m.createdAt) <= readAt || m.senderId === read.userId)) {
        position = m;
        break;
      }
    }
    if (!position || position.senderId === read.userId) continue;

    const reader = findUser(read.userId);
    if (!reader) continue;
    byMessage.set(position.id, [...(byMessage.get(position.id) ?? []), reader]);
  }
  return byMessage;
}

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
  reads,
}: MessageListProps) {
  const groups = groupMessages(messages);
  const { currentPreset } = useConversationTheme();

  const membersById = useMemo(
    () => new Map((members ?? []).map((member) => [member.id, member])),
    [members]
  );

  const readersByMessageId = useMemo(
    () =>
      placeReaders(messages, reads ?? {}, myUser?.id, (id) =>
        membersById.get(id) ?? (id === otherUser.id ? otherUser : undefined)
      ),
    [messages, reads, myUser?.id, membersById, otherUser]
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
          readersByMessageId={readersByMessageId}
        />
      ))}
    </div>
  );
}
