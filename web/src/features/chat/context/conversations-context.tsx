"use client";

import React, { createContext, useContext } from "react";
import { useConversations } from "../hooks/use-conversations";
import type { Conversation } from "@/type";

export interface ConversationsContextType {
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refetch: () => void;
  addOrUpdateConversation: (conv: Conversation) => void;
  replaceConversationId: (oldId: string, updated: Conversation) => void;
}

const ConversationsContext = createContext<ConversationsContextType | null>(null);

export function ConversationsProvider({
  children,
  initialConversations = [],
}: {
  children: React.ReactNode;
  initialConversations?: Conversation[];
}) {
  const conversationsState = useConversations({ initialConversations });

  return (
    <ConversationsContext.Provider value={conversationsState}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext(): ConversationsContextType {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error(
      "useConversationsContext must be used within a ConversationsProvider"
    );
  }
  return context;
}
