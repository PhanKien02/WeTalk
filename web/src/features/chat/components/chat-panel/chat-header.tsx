import Link from "next/link";
import { ChevronLeft, PanelRight, Phone, Video } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserAvatar } from "../shared/user-avatar";
import { cn } from "@/lib/utils";
import type { ChatHeaderProps } from "@/type";

export function ChatHeader({
  user,
  isGroup,
  memberCount,
  onlineCount,
  isDirectoryOpen,
  onToggleDirectory,
}: ChatHeaderProps) {
  const isOnline = isGroup ? (onlineCount ?? 0) > 0 : user.status === "online";

  const { t } = useI18n();

  return (
    <header className="h-21 shrink-0 border-b border-border bg-white dark:bg-[#11131f] px-4 sm:px-6 lg:px-8 flex items-center justify-between select-none transition-colors">
      {/* User Info */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <Link
          href="/messages"
          title={t.messages || "Quay lại"}
          aria-label={t.messages || "Back"}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0 cursor-pointer -ml-1"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
        </Link>
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size="lg"
          shape="rounded"
          showStatus={false}
          className="rounded-xl overflow-hidden shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug truncate">
            {user.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {isGroup
                ? `${onlineCount ?? 0}/${memberCount ?? 0} ${t.online.toLowerCase()}`
                : isOnline
                  ? t.online
                  : t.offline}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Theme Toggle + Calls + Directory Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Nút đổi sáng / tối / hệ thống */}
        <ThemeToggle />

        <div className="w-px h-6 bg-border mx-0.5" />

        <button
          type="button"
          title={t.videoCall}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary-soft text-primary hover:bg-primary-soft-hover active:scale-95 transition-all font-semibold text-sm cursor-pointer shadow-2xs"
        >
          <Video className="w-4 h-4 stroke-[2.4]" />
        </button>
        <button
          type="button"
          title={t.call}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary-soft text-primary hover:bg-primary-soft-hover active:scale-95 transition-all font-semibold text-sm cursor-pointer shadow-2xs"
        >
          <Phone className="w-4 h-4 stroke-[2.4]" />
        </button>

        {onToggleDirectory ? (
          <button
            type="button"
            onClick={onToggleDirectory}
            title={isDirectoryOpen ? t.closeDirectory : t.openDirectory}
            aria-label={isDirectoryOpen ? t.closeDirectory : t.openDirectory}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer shadow-2xs",
              isDirectoryOpen
                ? "bg-primary text-white hover:bg-primary/95 shadow-xs"
                : "bg-primary-soft text-primary hover:bg-primary-soft-hover active:scale-95"
            )}
          >
            <PanelRight className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
