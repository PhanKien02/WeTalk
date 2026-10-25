export enum UserStatusEnum {
  ONLINE = "online",
  OFFLINE = "offline",
}

export const UserStatus = UserStatusEnum;
export type UserStatus = "online" | "offline" | UserStatusEnum;
export type UserStatusType = UserStatus;

export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: UserStatus;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  username?: string;
  createdAt?: string | number | Date;
  created_at?: string | number | Date;
}

export interface QueryUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
  ids?: string[];
}

export interface QueryConversationsParams {
  limit?: number;
  offset?: number;
  textSearch?: string;
}

export interface RawConversation {
  id: string;
  isGroup: boolean;
  groupName: string;
  groupAvatar: string;
  description: string;
  memberCount: number;
  lastMessage: string;
  tags?: string[];
  memberIds?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateConversationPayload {
  isGroup: boolean;
  groupName: string;
  groupAvatar: string;
  description: string;
  tags?: string[];
  memberIds: string[];
}

export enum TagToneEnum {
  ORANGE = "orange",
  GREEN = "green",
  OUTLINE = "outline",
}

export const TagTone = TagToneEnum;
export type TagTone = "orange" | "green" | "outline" | TagToneEnum;
export type TagToneType = TagTone;

export interface Tag {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  tone: TagTone;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  /** Ảnh đính kèm (URL hoặc object URL) */
  images?: string[];
  conversationId?: string;
  /** ID tạm của tin nhắn optimistic, dùng để khớp với response và socket event */
  clientId?: string;
  isEdited?: boolean;
  createdAt?: string;
  /** Chỉ có ở client: "sending" khi đang gửi, "failed" khi gửi lỗi */
  status?: "sending" | "failed";
  /** Lý do gửi lỗi, hiển thị dưới bong bóng */
  error?: string;
}

export interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image";
  content: string;
  images: string[] | null;
  isEdited: boolean;
  clientId?: string;
  created_at: string;
  updated_at: string;
}

/** Vị trí đã đọc của một người trong cuộc hội thoại */
export interface MessageRead {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
  /** created_at của tin nhắn đã đọc cuối cùng */
  lastReadAt: string;
}

export interface UnreadCount {
  conversationId: string;
  count: number;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  online: boolean;
}

export interface QueryMessagesParams {
  conversationId: string;
  limit?: number;
  /** ISO time: chỉ lấy tin nhắn cũ hơn thời điểm này */
  before?: string;
}

export interface CreateMessagePayload {
  conversationId: string;
  content: string;
  images?: string[];
  clientId?: string;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  tags: Tag[];
  unreadCount?: number;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  memberCount?: number;
  pinnedCount?: number;
  memberIds?: string[];
  created_at?: string;
  updated_at?: string;
}

export enum FileTypeEnum {
  PDF = "pdf",
  PNG = "png",
  DOCX = "docx",
  XXL = "xxl",
}

export const FileType = FileTypeEnum;
export type FileType = "pdf" | "png" | "docx" | "xxl" | FileTypeEnum;
export type FileTypeType = FileType;

export interface SharedFile {
  id: string;
  name: string;
  extension: string;
  size: string;
  type: FileType;
  downloadUrl?: string;
  /** URL ảnh để xem trước (chỉ cho file ảnh) */
  previewUrl?: string;
}

export interface MessageGroup {
  senderId: string;
  isOwn: boolean;
  messages: Message[];
}

export interface CreateGroupFormValues {
  groupName: string;
}
