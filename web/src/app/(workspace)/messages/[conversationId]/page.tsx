import { notFound } from "next/navigation";
import {
  getConversation,
  getMessages,
  getSharedFiles,
  getTeamMembers,
} from "@/features/chat/lib/queries";
import { ChatPanel } from "@/features/chat/components/chat-panel/chat-panel";
import { DirectoryPanel } from "@/features/chat/components/directory/directory-panel";
import { ConversationThemeProvider } from "@/features/chat/context/conversation-theme-context";
import type { ConversationPageProps } from "@/type";

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    notFound();
  }

  const [messages, members, files] = await Promise.all([
    getMessages(conversationId),
    getTeamMembers(),
    getSharedFiles(),
  ]);

  return (
    <ConversationThemeProvider conversationId={conversation.id}>
      <div className="flex flex-1 h-full min-w-0 overflow-hidden">
        <ChatPanel conversation={conversation} initialMessages={messages} />
        <DirectoryPanel conversation={conversation} members={members} files={files} />
      </div>
    </ConversationThemeProvider>
  );
}
