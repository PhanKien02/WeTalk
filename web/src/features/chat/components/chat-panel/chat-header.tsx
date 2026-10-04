import { Phone, Video } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserAvatar } from "../shared/user-avatar";
import type { ChatHeaderProps } from "@/type";

export function ChatHeader({ user }: ChatHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="h-21 shrink-0 border-b border-border bg-white dark:bg-[#11131f] px-8 flex items-center justify-between select-none transition-colors">
      {/* User Info */}
      <div className="flex items-center gap-3.5">
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size="lg"
          shape="rounded"
          showStatus={false}
          className="rounded-xl overflow-hidden"
        />
        <div className="flex flex-col">
          <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {user.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                user.status === "online" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
              {user.status === "online" ? t.online : t.offline}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Theme Toggle + Calls */}
      <div className="flex items-center gap-2.5">
        {/* Nút đổi sáng / tối / hệ thống */}
        <ThemeToggle />

        <div className="w-px h-6 bg-border mx-1" />

        <button
          type="button"
          title={t.videoCall}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-soft text-primary hover:bg-primary-soft-hover active:scale-95 transition-all font-semibold text-sm cursor-pointer shadow-2xs"
        >
          <Video className="w-4 h-4 stroke-[2.4]" />
        </button>
        <button
          type="button"
          title={t.call}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-soft text-primary hover:bg-primary-soft-hover active:scale-95 transition-all font-semibold text-sm cursor-pointer shadow-2xs"
        >
          <Phone className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>
    </header>
  );
}
