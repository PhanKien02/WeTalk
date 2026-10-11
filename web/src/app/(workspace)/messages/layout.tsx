import { ConversationSidebar } from "@/features/chat/components/conversation-sidebar/conversation-sidebar";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 h-full min-w-0 overflow-hidden">
      <ConversationSidebar />
      <div className="flex-1 flex h-full min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
