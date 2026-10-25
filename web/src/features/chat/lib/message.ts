import type { Message, RawMessage } from "@/type";

export function formatMessageTime(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function normalizeMessage(raw: RawMessage, currentUserId?: string): Message {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    content: raw.content,
    images: raw.images?.length ? raw.images : undefined,
    isEdited: raw.isEdited,
    clientId: raw.clientId,
    createdAt: raw.created_at,
    timestamp: formatMessageTime(raw.created_at),
    isOwn: Boolean(currentUserId) && raw.senderId === currentUserId,
  };
}

/** Nội dung hiển thị ở sidebar cho tin nhắn cuối */
export function messagePreview(message: Pick<RawMessage, "content" | "images">): string {
  const content = message.content?.trim();
  if (content) return content;
  return message.images?.length ? "[Hình ảnh]" : "";
}

/**
 * Thêm hoặc thay thế một tin nhắn. Tin optimistic được khớp qua clientId, nên
 * response của API và socket event cho cùng một tin không bị nhân đôi.
 */
export function upsertMessage(list: Message[], message: Message): Message[] {
  const index = list.findIndex(
    (m) =>
      m.id === message.id ||
      (message.clientId !== undefined && m.clientId === message.clientId)
  );
  if (index === -1) return [...list, message];

  const next = [...list];
  next[index] = { ...message, images: message.images ?? list[index].images };
  return next;
}

/** Gộp một trang tin nhắn từ server vào danh sách hiện tại, sắp xếp cũ → mới */
export function mergeMessages(list: Message[], incoming: Message[]): Message[] {
  let next = list;
  for (const message of incoming) next = upsertMessage(next, message);
  return [...next].sort((a, b) => {
    // Tin chưa có createdAt (đang gửi) luôn nằm cuối
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    // So sánh theo thời gian, không theo chuỗi: số chữ số thập phân của giây có thể khác nhau
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  });
}
