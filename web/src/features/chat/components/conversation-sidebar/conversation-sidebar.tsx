"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ConversationItem } from "./conversation-item";
import { ConversationSearch } from "./conversation-search";
import { NewConversationModal } from "./new-conversation-modal";
import type { ConversationSidebarProps } from "@/type";

export function ConversationSidebar({
  conversations,
}: ConversationSidebarProps) {
  const { t } = useI18n();
  const params = useParams();
  const activeId = (params?.conversationId as string) || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.user.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  return (
    <>
      <div className="w-85 xl:w-90 shrink-0 h-full border-r border-border bg-white dark:bg-[#11131f] flex flex-col select-none transition-colors">
        {/* Top Header */}
        <div className="px-6 pt-7 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors cursor-pointer group">
              <h1 className="text-[22px] font-bold tracking-tight">
                {t.messages}
              </h1>
            </button>
          </div>

          {/* Nút thêm mới hội thoại (+) */}
          <button
            type="button"
            title={t.newMessage}
            onClick={() => setIsNewModalOpen(true)}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(97,94,240,0.35)] cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="px-6 py-2">
          <ConversationSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((item) => (
              <ConversationItem
                key={item.id}
                conversation={item}
                isActive={item.id === activeId}
              />
            ))
          ) : (
            <div className="py-12 text-center text-sm text-zinc-400">
              {t.emptyChat}
            </div>
          )}
        </div>
      </div>

      {/* Modal New Conversation */}
      <NewConversationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </>
  );
}
