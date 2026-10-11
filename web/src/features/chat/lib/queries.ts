import { cookies } from "next/headers";
import { mockConversations, mockFiles, mockMessages, mockTeamMembers, mockUsers } from "../data/mock-data";
import { normalizeConversation } from "../hooks/use-conversations";
import { COOKIES } from "@/lib/cookieName";
import type { Conversation, Message, RawConversation, SharedFile, User } from "@/type";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const API_URL = cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;

async function getServerAuthHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const tokenVal = cookieStore.get(COOKIES.ACCESSTOKEN)?.value;
    if (tokenVal) {
      let cleanToken = tokenVal;
      try {
        cleanToken = JSON.parse(tokenVal);
      } catch {
        cleanToken = tokenVal;
      }
      return {
        Authorization: `Bearer ${cleanToken}`,
      };
    }
  } catch {
    // cookies() may throw outside of request scope
  }
  return {};
}

export async function getConversations(): Promise<Conversation[]> {
  return [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  // 1. Check local mock data
  const found = mockConversations.find((c) => c.id === id);
  if (found) return found;

  if (mockUsers[id]) {
    const user = mockUsers[id];
    return {
      id: user.id,
      user,
      lastMessage: "Bắt đầu cuộc trò chuyện mới...",
      timestamp: "Vừa xong",
      tags: [],
      isGroup: false,
      memberIds: [user.id],
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

  // 2. Fetch conversation from backend API
  try {
    const headers = await getServerAuthHeaders();
    const res = await fetch(`${API_URL}/v1/conversations/${id}`, {
      headers: { ...headers, "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        return normalizeConversation(json.data as RawConversation);
      }
    }
  } catch (err) {
    console.warn(`Could not fetch conversation ${id} from server:`, err);
  }

  // 3. If not a conversation ID, it might be a user ID (for a new 1-1 conversation)
  try {
    const headers = await getServerAuthHeaders();
    const res = await fetch(`${API_URL}/v1/users/${id}`, {
      headers: { ...headers, "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        const u = json.data as User;
        return {
          id: u.id,
          user: {
            id: u.id,
            name: u.name || "Người dùng",
            avatar:
              u.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
            status: u.status || "offline",
            email: u.email,
            phone: u.phone,
            bio: u.bio,
          },
          lastMessage: "Bắt đầu cuộc trò chuyện mới...",
          timestamp: "Vừa xong",
          tags: [],
          isGroup: false,
          groupName: u.name,
          memberIds: [u.id],
        };
      }
    }
  } catch (err) {
    console.warn(`Could not fetch user ${id} from server:`, err);
  }

  // 4. Default resilient fallback for new conversations to avoid 404
  if (id && id.trim()) {
    return {
      id,
      user: {
        id,
        name: "Người dùng",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
        status: "online",
      },
      lastMessage: "Bắt đầu cuộc trò chuyện mới...",
      timestamp: "Vừa xong",
      tags: [],
      isGroup: false,
      memberIds: [id],
    };
  }

  return null;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return mockMessages[conversationId] || [];
}

export async function getTeamMembers(): Promise<User[]> {
  return mockTeamMembers;
}

export async function getSharedFiles(): Promise<SharedFile[]> {
  return mockFiles;
}
