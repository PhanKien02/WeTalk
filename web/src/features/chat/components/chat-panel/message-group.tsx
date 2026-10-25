import { UserAvatar } from "../shared/user-avatar";
import { MessageBubble } from "./message-bubble";
import type { MessageGroupProps } from "@/type";

export function MessageGroup({ group, otherUser, myUser, onRetry }: MessageGroupProps) {
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
          <div
            key={message.id}
            className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
          >
            <MessageBubble message={message} />
            {message.status === "sending" && (
              <span className="text-[11px] text-zinc-400 px-1">Đang gửi...</span>
            )}
            {message.status === "failed" && (
              <span className="text-[11px] text-red-500 px-1">
                {message.error || "Gửi thất bại"}
                {onRetry && !message.images?.length && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      className="font-semibold underline cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </>
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
