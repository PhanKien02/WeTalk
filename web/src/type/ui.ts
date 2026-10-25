import type {
  Conversation,
  Message,
  MessageGroup,
  MessageRead,
  SharedFile,
  Tag,
  User,
  UserStatusType,
} from "./chat";

export interface AppLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  priority?: boolean;
  /** Hiện thẻ xem trước logo lớn khi hover */
  previewOnHover?: boolean;
}

export interface UserAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: UserStatusType;
  className?: string;
  shape?: "rounded" | "circle";
  /** Click để mở ảnh phóng to */
  previewable?: boolean;
}

export interface ConversationTagProps {
  tag: Tag;
  className?: string;
}

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
}

export interface MessageGroupProps {
  group: MessageGroup;
  otherUser: User;
  myUser?: User;
  onRetry?: (message: Message) => void;
  /** Người đã xem, đặt dưới tin nhắn cuối cùng họ đã đọc */
  readersByMessageId?: Map<string, User[]>;
}

export interface MessageComposerProps {
  onSendMessage: (content: string, images?: string[]) => void;
  /** Gọi mỗi lần gõ phím; dùng để báo "đang soạn tin" */
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export interface MessageListProps {
  messages: Message[];
  otherUser: User;
  myUser?: User;
  /** Thành viên nhóm, dùng để hiển thị đúng người gửi */
  members?: User[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  loadError?: string | null;
  onLoadMore?: () => void;
  onRetry?: (message: Message) => void;
  /** Vị trí đã đọc của từng thành viên, theo userId */
  reads?: Record<string, MessageRead>;
}

export interface ChatHeaderProps {
  user: User;
  isGroup?: boolean;
  memberCount?: number;
  /** Số thành viên đang online (chỉ dùng cho nhóm) */
  onlineCount?: number;
  isDirectoryOpen?: boolean;
  onToggleDirectory?: () => void;
}

export interface ChatPanelProps {
  conversation: Conversation;
  members?: User[];
  /** Thành viên đang soạn tin, không gồm mình */
  typingUsers?: User[];
  onlineCount?: number;
  onTyping?: () => void;
  onStopTyping?: () => void;
  isDirectoryOpen?: boolean;
  onToggleDirectory?: () => void;
}

export interface ConversationSidebarProps {
  conversations?: Conversation[];
}

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
}

export interface ConversationSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export interface DirectoryPanelProps {
  conversation: Conversation;
  members: User[];
  files: SharedFile[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isLoadingMembers?: boolean;
}

export interface MemberItemProps {
  member: User;
}

export interface FileItemProps {
  file: SharedFile;
}