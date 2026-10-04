"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ConversationItemProps } from "@/type";
import { UserAvatar } from "../shared/user-avatar";
import { ConversationTag } from "../shared/conversation-tag";

export function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  const { user, lastMessage, timestamp, tags } = conversation;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "group relative flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-150 select-none cursor-pointer",
        isActive
          ? "bg-[#F5F5FF] dark:bg-primary-soft/30 shadow-[0_2px_8px_rgba(97,94,240,0.06)]"
          : "hover:bg-zinc-50/80 dark:hover:bg-white/5 active:bg-zinc-100/70 dark:active:bg-white/10"
      )}
    >
      {/* Avatar người dùng */}
      <UserAvatar
        src={user.avatar}
        name={user.name}
        size="lg"
        shape="rounded"
        showStatus={false}
        className="shrink-0 rounded-2xl overflow-hidden mt-0.5"
      />

      {/* Thông tin chính */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Tên + Thời gian */}
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={cn(
              "text-[15px] font-semibold truncate leading-snug",
              isActive ? "text-zinc-950 dark:text-white font-bold" : "text-zinc-800 dark:text-zinc-200"
            )}
          >
            {user.name}
          </h3>
          <span className="text-[12px] font-medium text-zinc-400 shrink-0">
            {timestamp}
          </span>
        </div>

        {/* Nội dung tin nhắn cuối */}
        <p className="text-[13px] text-zinc-500 truncate leading-snug">
          {lastMessage}
        </p>

        {/* Tags nhãn */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {tags.map((tag) => (
              <ConversationTag key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
