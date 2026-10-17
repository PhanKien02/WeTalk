"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useConversationsContext } from "../context/conversations-context";
import { conversationService } from "@/services/conversation.service";
import { userService } from "@/services/user.service";
import type { Conversation, CreateConversationPayload, Message } from "@/type";

export function useChatMessages(
  conversationOrId: Conversation | string,
  initialMessages: Message[] = []
) {
  const conversation =
    typeof conversationOrId === "object" ? conversationOrId : null;
  const conversationId =
    typeof conversationOrId === "object"
      ? conversationOrId.id
      : conversationOrId;

  const { user: currentUser } = useAuth();
  const { conversations, addOrUpdateConversation, replaceConversationId } =
    useConversationsContext();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setMessages(initialMessages);
  }

  // Track the actual current conversation ID (which might change from temp/userId to created ID)
  const currentConversationIdRef = useRef(conversationId);
  const isCreatedOnBackendRef = useRef(false);
  const isCreatingRef = useRef(false);

  useEffect(() => {
    currentConversationIdRef.current = conversationId;

    // Check if the current conversation is already a real conversation in the server list
    const existsInServerList = conversations.some(
      (c) =>
        c.id === conversationId &&
        !c.id.startsWith("mock-") &&
        !c.id.startsWith("temp-")
    );
    isCreatedOnBackendRef.current = existsInServerList || Boolean(conversation?.created_at);
    isCreatingRef.current = false;
  }, [conversationId, conversation, initialMessages, conversations]);

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

  const sendMessage = async (content: string, images?: string[]) => {
    if (!content.trim() && !images?.length) return;

    const trimmedContent = content.trim();

    // 1. Lập tức thêm tin nhắn mới vào danh sách hiển thị ở client
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser?.id || "me",
      content: trimmedContent,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
      ...(images?.length ? { images } : {}),
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      scrollToBottom();
    }, 50);

    const activeConvId = currentConversationIdRef.current;
    const isGroup = conversation?.isGroup === true;
    const isFirstMessage = messages.length === 0;

    // Target user ID in direct conversation
    const targetUserId =
      conversation?.memberIds?.find((id) => id && id !== currentUser?.id) ||
      (conversation?.user?.id && conversation.user.id !== activeConvId
        ? conversation.user.id
        : activeConvId !== conversation?.id
        ? activeConvId
        : conversation?.user?.id || activeConvId);

    // Kiểm tra xem cuộc hội thoại này đã tồn tại trên backend chưa
    const alreadyExistsInContext = conversations.some(
      (c) =>
        (c.id === activeConvId &&
          !c.id.startsWith("mock-") &&
          !c.id.startsWith("temp-")) ||
        (!c.isGroup && targetUserId && c.memberIds?.includes(targetUserId))
    );
    const hasCreatedAt = Boolean(conversation?.created_at);
    const isAlreadyCreated =
      isCreatedOnBackendRef.current || alreadyExistsInContext || hasCreatedAt;

    // Trường hợp cuộc hội thoại đã có sẵn (hoặc là group): Cập nhật last message ở client
    if (isAlreadyCreated || isGroup) {
      const realConv =
        conversations.find(
          (c) =>
            c.id === activeConvId ||
            (!c.isGroup && targetUserId && c.memberIds?.includes(targetUserId))
        ) || conversation;

      if (realConv) {
        const targetId = realConv.id || activeConvId;
        addOrUpdateConversation({
          ...realConv,
          id: targetId,
          lastMessage: trimmedContent || (images?.length ? "[Hình ảnh]" : ""),
          timestamp: "Vừa xong",
        });

        if (targetId !== activeConvId) {
          currentConversationIdRef.current = targetId;
          window.history.replaceState(null, "", `/messages/${targetId}`);
        }
      }
      return;
    }

    // Trường hợp cuộc hội thoại 1-1 CHƯA tạo trên backend:
    if (!isAlreadyCreated && !isGroup) {
      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      try {
        const senderId = currentUser?.id || "me";
        let senderName = currentUser?.name || "Người dùng";
        // 1. Get user by id để lấy thông tin người gửi
        if (currentUser?.id) {
          try {
            const senderRes = await userService.getUserById(currentUser.id);
            if (senderRes?.data) {
              senderName = senderRes.data.name || senderName;
            }
          } catch (err) {
            console.warn("Lỗi khi lấy thông tin người gửi từ userService.getUserById:", err);
          }
        }

        // Lấy thông tin người nhận (target user)
        const targetUserId = conversation?.user?.id || conversationId;
        let targetUserName = conversation?.user?.name || "";
        let targetUserAvatar = conversation?.user?.avatar || "";

        // Nếu thông tin người nhận chưa có, fetch thêm thông tin người nhận
        if ((!targetUserName || targetUserName === "Người dùng") && targetUserId && targetUserId !== senderId) {
          try {
            const targetRes = await userService.getUserById(targetUserId);
            if (targetRes?.data) {
              targetUserName = targetRes.data.name || targetUserName;
              targetUserAvatar = targetRes.data.avatar || targetUserAvatar;
            }
          } catch (err) {
            console.warn("Lỗi khi lấy thông tin người nhận từ userService.getUserById:", err);
          }
        }

        if (!targetUserName) {
          targetUserName = "Người dùng";
        }

        // 2. Nếu không phải nhóm: GroupName là tên hai người ghép lại
        const combinedGroupName = [senderName, targetUserName]
          .filter(Boolean)
          .join(", ");

        const memberIds = [senderId, targetUserId].filter(
          (id, idx, arr) => id && arr.indexOf(id) === idx
        );

        // 3. Lập tức tạo mới cuộc hội thoại ở client
        const optimisticConversation: Conversation = {
          id: activeConvId,
          user: {
            id: targetUserId,
            name: targetUserName,
            avatar:
              targetUserAvatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
            status: conversation?.user?.status || "online",
          },
          lastMessage: trimmedContent || (images?.length ? "[Hình ảnh]" : ""),
          timestamp: "Vừa xong",
          tags: [
            {
              id: `tag-${Date.now()}`,
              labelKey: "direct",
              fallbackLabel: "Trực tiếp",
              tone: "orange",
            },
          ],
          isGroup: false,
          groupName: combinedGroupName,
          groupAvatar: targetUserAvatar || "",
          description: `Cuộc trò chuyện giữa ${combinedGroupName}`,
          memberIds,
        };

        // Lập tức hiển thị trên danh sách hội thoại ở client (Sidebar)
        addOrUpdateConversation(optimisticConversation);

        // 4. Call API tạo mới cuộc hội thoại (khi gửi tin nhắn đầu tiên)
        if (isFirstMessage) {
          const payload: CreateConversationPayload = {
            isGroup: false,
            groupName: combinedGroupName,
            groupAvatar:
              targetUserAvatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
            description: `Cuộc trò chuyện giữa ${combinedGroupName}`,
            tags: ["direct"],
            memberIds,
          };

          const createRes = await conversationService.createConversation(payload);

          if (createRes?.data?.id) {
            const newConversationId = createRes.data.id;
            isCreatedOnBackendRef.current = true;
            currentConversationIdRef.current = newConversationId;

            // Cập nhật lại id cuộc hội thoại trong context từ ID tạm sang ID thật
            replaceConversationId(activeConvId, {
              ...optimisticConversation,
              id: newConversationId,
              created_at: createRes.data.created_at,
            });

            // Cập nhật URL trình duyệt sang ID mới mà không làm reload trang
            window.history.replaceState(null, "", `/messages/${newConversationId}`);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tạo mới cuộc hội thoại qua API:", err);
      } finally {
        isCreatingRef.current = false;
      }
    }
  };

  return {
    messages,
    sendMessage,
    scrollRef,
  };
}
