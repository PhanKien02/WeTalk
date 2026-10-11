import { ConversationSidebar } from "@/features/chat/components/conversation-sidebar/conversation-sidebar";
import { ConversationsProvider } from "@/features/chat/context/conversations-context";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConversationsProvider>
      <div className="flex flex-1 h-full min-w-0 overflow-hidden">
        <ConversationSidebar />
        <div className="flex-1 flex h-full min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </ConversationsProvider>
  );
}
