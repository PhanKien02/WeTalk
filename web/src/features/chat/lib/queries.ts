import { mockConversations, mockFiles, mockMessages, mockTeamMembers, mockUsers } from "../data/mock-data";
import { Conversation, Message, SharedFile, User } from "../types";

export async function getConversations(): Promise<Conversation[]> {
  return mockConversations;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const found = mockConversations.find((c) => c.id === id);
  if (found) return found;

  // Fallback for newly initiated conversations with any mockUser
  if (mockUsers[id]) {
    const user = mockUsers[id];
    return {
      id: user.id,
      user,
      lastMessage: "Bắt đầu cuộc trò chuyện mới...",
      timestamp: "Vừa xong",
      tags: [],
    };
  }

  // Fallback for custom group IDs
  if (id.startsWith("group-")) {
    return {
      id,
      user: {
        id: "group-admin",
        name: id.replace("group-", "Nhóm "),
        avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop",
        status: "online",
      },
      lastMessage: "Nhóm đã được tạo thành công",
      timestamp: "Vừa xong",
      tags: [{ id: "tag-team", labelKey: "followUp", fallbackLabel: "Nhóm mới", tone: "orange" }],
      isGroup: true,
      groupName: id.replace("group-", "Nhóm "),
      description: "Nhóm thảo luận công việc WeTalk",
      memberCount: 3,
    };
  }

  return null;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return mockMessages[conversationId] || [
    {
      id: "init_1",
      senderId: conversationId,
      content: "Hello! This is a demo conversation.",
      timestamp: "Just now",
      isOwn: false,
    },
  ];
}

export async function getTeamMembers(): Promise<User[]> {
  return mockTeamMembers;
}

export async function getSharedFiles(): Promise<SharedFile[]> {
  return mockFiles;
}
