"use client";

import { useChatMessages } from "../../hooks/use-chat-messages";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";
import type { ChatPanelProps } from "@/type";

export function ChatPanel({ conversation, initialMessages }: ChatPanelProps) {
  const { messages, sendMessage, scrollRef } = useChatMessages(
    conversation.id,
    initialMessages
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f111a] border-r border-border min-w-0 transition-colors">
      <ChatHeader user={conversation.user} />
      <MessageList
        messages={messages}
        otherUser={conversation.user}
        scrollRef={scrollRef}
      />
      <MessageComposer onSendMessage={sendMessage} />
    </div>
  );
}
