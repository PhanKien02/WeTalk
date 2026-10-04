"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "../types";

export function useChatMessages(conversationId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversationId]);

  const sendMessage = (content: string, images?: string[]) => {
    if (!content.trim() && !images?.length) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      ...(images?.length ? { images } : {}),
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Giả lập trả lời sau 1.2s nếu chat với Florencio
    if (conversationId === "florencio") {
      setTimeout(() => {
        const replyMsg: Message = {
          id: `reply_${Date.now()}`,
          senderId: "florencio",
          content: "That sounds awesome! 🚀",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isOwn: false,
        };
        setMessages((prev) => [...prev, replyMsg]);
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      }, 1200);
    }
  };

  return {
    messages,
    sendMessage,
    scrollRef,
  };
}
