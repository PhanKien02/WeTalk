import type {
  Conversation,
  Message,
  MessageGroup,
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
}

export interface MessageBubbleProps {
  message: Message;
}

export interface MessageGroupProps {
  group: MessageGroup;
  otherUser: User;
  myUser?: User;
}

export interface MessageComposerProps {
  onSendMessage: (content: string, images?: string[]) => void;
}

export interface MessageListProps {
  messages: Message[];
  otherUser: User;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export interface ChatHeaderProps {
  user: User;
}

export interface ChatPanelProps {
  conversation: Conversation;
  initialMessages: Message[];
}

export interface ConversationSidebarProps {
  conversations: Conversation[];
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
}

export interface MemberItemProps {
  member: User;
}

export interface FileItemProps {
  file: SharedFile;
}

export interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}
