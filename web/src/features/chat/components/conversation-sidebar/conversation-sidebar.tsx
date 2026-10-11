"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, MessageSquareDashed, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useConversationsContext } from "../../context/conversations-context";
import { ConversationItem } from "./conversation-item";
import { ConversationSearch } from "./conversation-search";
import { ConversationSidebarSkeleton } from "./conversation-skeleton";
import { NewConversationModal } from "./new-conversation-modal";
import type { ConversationSidebarProps } from "@/type";

export function ConversationSidebar({}: ConversationSidebarProps = {}) {
  const { t } = useI18n();
  const params = useParams();
  const activeId = (params?.conversationId as string) || "";
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    searchQuery,
    setSearchQuery,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch,
  } = useConversationsContext();

  // Use IntersectionObserver instead of onScroll layout thrashing
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        root: container,
        rootMargin: "120px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const handleOpenNewModal = useCallback(() => setIsNewModalOpen(true), []);
  const handleCloseNewModal = useCallback(() => setIsNewModalOpen(false), []);

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
            onClick={handleOpenNewModal}
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
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5"
        >
          {isLoading && conversations.length === 0 ? (
            <ConversationSidebarSkeleton />
          ) : conversations.length > 0 ? (
            <>
              {conversations.map((item) => (
                <ConversationItem
                  key={item.id}
                  conversation={item}
                  isActive={item.id === activeId}
                />
              ))}

              {/* Sentinel element for infinite scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
              )}

              {isLoadingMore && (
                <div className="py-3 flex justify-center items-center text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </>
          ) : (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400">
                <MessageSquareDashed className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t.emptyChat}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal New Conversation */}
      <NewConversationModal
        isOpen={isNewModalOpen}
        onClose={handleCloseNewModal}
        onSuccess={refetch}
      />
    </>
  );
}
