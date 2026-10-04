import { getConversations } from "@/features/chat/lib/queries";
import { ConversationSidebar } from "@/features/chat/components/conversation-sidebar/conversation-sidebar";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conversations = await getConversations();

  return (
    <div className="flex flex-1 h-full min-w-0 overflow-hidden">
      <ConversationSidebar conversations={conversations} />
      <div className="flex-1 flex h-full min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
