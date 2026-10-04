import { UserAvatar } from "../shared/user-avatar";
import { MessageBubble } from "./message-bubble";
import type { MessageGroupProps } from "@/type";

export function MessageGroup({ group, otherUser, myUser }: MessageGroupProps) {
  const { isOwn, messages } = group;

  const user = isOwn
    ? myUser || {
        id: "me",
        name: "Me",
        avatar: "https://randomuser.me/api/portraits/men/91.jpg",
        status: "online" as const,
      }
    : otherUser;

  return (
    <div
      className={`flex items-start gap-3 my-4 ${
        isOwn ? "flex-row-reverse justify-start" : "justify-start"
      }`}
    >
      {/* Avatar người gửi ở đầu nhóm */}
      <UserAvatar
        src={user.avatar}
        name={user.name}
        size="md"
        shape="rounded"
        previewable
        className="rounded-xl overflow-hidden shrink-0 mt-0.5"
      />

      {/* Danh sách các bong bóng của nhóm */}
      <div
        className={`flex flex-col gap-1.5 max-w-[70%] ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}
