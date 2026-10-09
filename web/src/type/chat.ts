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
  status: UserStatus;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  username?: string;
  createdAt?: string | number | Date;
  created_at?: string | number | Date;
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
