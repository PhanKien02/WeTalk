"use client";

import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationSidebar } from "@/features/chat/components/conversation-sidebar/conversation-sidebar";
import { ConversationsProvider } from "@/features/chat/context/conversations-context";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const activeId =
    typeof params?.conversationId === "string" ? params.conversationId : "";

  return (
    <ConversationsProvider>
      <div className="flex flex-1 h-full min-w-0 overflow-hidden">
        <ConversationSidebar />
        <div
          className={cn(
            "flex-1 flex h-full min-w-0 overflow-hidden",
            !activeId ? "hidden md:flex" : "flex"
          )}
        >
          {children}
        </div>
      </div>
    </ConversationsProvider>
  );
}
