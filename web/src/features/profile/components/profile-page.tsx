"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, Undo2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { mockUsers } from "@/features/chat/data/mock-data";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ProfileTab } from "./profile-tab";
import { NotificationsTab } from "./notifications-tab";
import { SecurityTab } from "./security-tab";
import type { ProfileTabKey } from "@/type";

export function ProfilePage() {
  const { locale, t } = useI18n();
  const { logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("profile");

  // Avatar states shared for header/toast
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    mockUsers.me.avatar || "https://randomuser.me/api/portraits/men/91.jpg",
  );
  const [prevAvatarSrc, setPrevAvatarSrc] = useState<string | null>(null);

  // Undo Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canUndoAvatar, setCanUndoAvatar] = useState(false);

  const showToast = (msg: string, canUndo = false) => {
    setToastMessage(msg);
    setCanUndoAvatar(canUndo);
    setTimeout(() => {
      setToastMessage(null);
      setCanUndoAvatar(false);
    }, 4500);
  };

  const handleUndoAvatar = () => {
    if (prevAvatarSrc) {
      setAvatarSrc(prevAvatarSrc);
      setCanUndoAvatar(false);
      setToastMessage(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] dark:bg-[#0b0d14] overflow-hidden select-text transition-colors">
      {/* Top Header */}
      <header className="h-16 px-8 border-b border-border bg-white dark:bg-[#11131f] flex items-center justify-between shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <Link
            href="/messages"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            title={t.messages}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {t.accountSettings}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            href="/messages"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-primary hover:bg-primary-soft/70 dark:hover:bg-primary/20 transition-colors"
          >
            ← {t.messages}
          </Link>

          <button
            type="button"
            onClick={logout}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shadow-2xs"
            title={t.signOut}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Underline Tabs */}
          <div className="relative border-b border-border">
            <nav className="flex gap-8 -mb-px">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "cursor-pointer pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "profile"
                    ? "text-primary border-b-2 border-primary"
                    : "text-zinc-500 hover:text-foreground",
                )}
              >
                {t.personalInfo}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notifications")}
                className={cn(
                  "cursor-pointer pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "notifications"
                    ? "text-primary border-b-2 border-primary"
                    : "text-zinc-500 hover:text-foreground",
                )}
              >
                {t.notifications}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={cn(
                  "cursor-pointer pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "security"
                    ? "text-primary border-b-2 border-primary"
                    : "text-zinc-500 hover:text-foreground",
                )}
              >
                {t.security}
              </button>
            </nav>
          </div>

          {/* TAB CONTENTS */}
          {activeTab === "profile" && (
            <ProfileTab
              onShowToast={showToast}
              avatarSrc={avatarSrc}
              setAvatarSrc={setAvatarSrc}
              setPrevAvatarSrc={setPrevAvatarSrc}
            />
          )}

          {activeTab === "notifications" && <NotificationsTab />}

          {activeTab === "security" && <SecurityTab onShowToast={showToast} />}
        </div>
      </div>

      {/* Undo Toast Notification (Floating bottom right) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium">
            <span>{toastMessage}</span>
            {canUndoAvatar && (
              <button
                type="button"
                onClick={handleUndoAvatar}
                className="cursor-pointer inline-flex items-center gap-1 font-bold text-primary-soft hover:underline underline-offset-2 ml-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {locale === "vi" ? "Hoàn tác" : "Undo"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="cursor-pointer text-zinc-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
