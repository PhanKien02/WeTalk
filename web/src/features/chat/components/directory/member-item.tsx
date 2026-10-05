"use client";

import type { MemberItemProps } from "@/type";
import { UserAvatar } from "../shared/user-avatar";

export function MemberItem({ member }: MemberItemProps) {
  return (
    <div className="flex items-center gap-3.5 py-2.5 px-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors select-none">
      <UserAvatar
        src={member.avatar}
        name={member.name}
        size="md"
        shape="rounded"
        showStatus={false}
        className="rounded-xl overflow-hidden shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <h4 className="text-[14px] font-semibold text-foreground truncate leading-snug">
          {member.name}
        </h4>
        {member.username && (
          <span className="text-[12px] text-muted-foreground truncate leading-snug mt-0.5">
            {member.username}
          </span>
        )}
      </div>
    </div>
  );
}
