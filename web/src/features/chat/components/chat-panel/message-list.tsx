import { cn } from "@/lib/utils";
import { groupMessages } from "../../lib/group-messages";
import { MessageGroup } from "./message-group";
import { useConversationTheme } from "../../context/conversation-theme-context";
import type { MessageListProps } from "@/type";

export function MessageList({ messages, otherUser, scrollRef }: MessageListProps) {
  const groups = groupMessages(messages);
  const { currentPreset } = useConversationTheme();

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex-1 overflow-y-auto px-8 py-6 flex flex-col justify-start select-text transition-all duration-300 relative",
        currentPreset.className
      )}
      style={currentPreset.style}
    >
      {groups.map((group, idx) => (
        <MessageGroup key={idx} group={group} otherUser={otherUser} />
      ))}
    </div>
  );
}
