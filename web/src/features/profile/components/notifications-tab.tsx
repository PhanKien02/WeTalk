"use client";

import React, { useState } from "react";
import { Bell, Mail, Moon, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function NotificationsTab() {
  const { locale } = useI18n();

  const [desktopEnabled, setDesktopEnabled] = useState(true);
  const [emailSummaryEnabled, setEmailSummaryEnabled] = useState(true);
  const [directMessagesSound, setDirectMessagesSound] = useState(true);
  const [groupMentionOnly, setGroupMentionOnly] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Notification Channels */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {locale === "vi" ? "Kênh nhận thông báo" : "Notification Channels"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "vi"
              ? "Chọn cách bạn muốn nhận cảnh báo và tin nhắn mới."
              : "Choose how you want to receive alerts and new messages."}
          </p>
        </div>

        <div className="divide-y divide-border/70 dark:divide-white/10">
          {/* Desktop Push */}
          <div className="px-6 py-4.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary-soft dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 stroke-2" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {locale === "vi"
                    ? "Thông báo trên màn hình"
                    : "Desktop Notifications"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === "vi"
                    ? "Hiển thị thông báo khi ứng dụng đang chạy ở chế độ nền"
                    : "Show desktop banner when WeTalk is running in background"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={desktopEnabled}
              onClick={() => setDesktopEnabled(!desktopEnabled)}
              className={cn(
                "cursor-pointer relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                desktopEnabled ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  desktopEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Email Digest */}
          <div className="px-6 py-4.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {locale === "vi"
                    ? "Bản tin tổng hợp qua Email"
                    : "Email Digest"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === "vi"
                    ? "Gửi email tổng hợp các tin nhắn và phản hồi chưa đọc hàng ngày"
                    : "Receive a daily digest of unread mentions and messages"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={emailSummaryEnabled}
              onClick={() => setEmailSummaryEnabled(!emailSummaryEnabled)}
              className={cn(
                "cursor-pointer relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                emailSummaryEnabled ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  emailSummaryEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Rules & Preferences */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {locale === "vi"
              ? "Quy tắc báo tin nhắn"
              : "Message Notification Rules"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "vi"
              ? "Tùy biến âm thanh và phạm vi nhận thông báo nhóm."
              : "Customize notification chime and group conversation alerts."}
          </p>
        </div>

        <div className="divide-y divide-border/70 dark:divide-white/10">
          <div className="px-6 py-4.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {locale === "vi"
                    ? "Âm thanh tin nhắn trực tiếp"
                    : "Direct Message Chime"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === "vi"
                    ? "Phát âm thanh nhẹ khi có tin nhắn 1-1"
                    : "Play chime for private one-on-one chats"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={directMessagesSound}
              onClick={() => setDirectMessagesSound(!directMessagesSound)}
              className={cn(
                "cursor-pointer relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                directMessagesSound ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  directMessagesSound ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          <div className="px-6 py-4.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {locale === "vi"
                    ? "Chỉ báo khi được nhắc tên (@mention)"
                    : "Only notify on @mentions"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === "vi"
                    ? "Giảm tiếng ồn trong các nhóm lớn, chỉ báo khi có người tag bạn"
                    : "Mute normal group chatter; notify only when directly tagged"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={groupMentionOnly}
              onClick={() => setGroupMentionOnly(!groupMentionOnly)}
              className={cn(
                "cursor-pointer relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                groupMentionOnly ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  groupMentionOnly ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
