"use client";

import { useState } from "react";
import {
  AtSign,
  Bell,
  BellOff,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Info,
  Lock,
  LogOut,
  Mail,
  MapPin,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  Pin,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Video,
  Ban,
  ChevronRight,
  Palette,
  Smile,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DirectoryPanelProps } from "@/type";
import { UserAvatar } from "../shared/user-avatar";
import { MemberItem } from "./member-item";
import { FileItem } from "./file-item";
import { useConversationTheme } from "../../context/conversation-theme-context";
import { WallpaperPickerModal } from "../dialogs/wallpaper-picker-modal";
import { DefaultEmojiModal } from "../dialogs/default-emoji-modal";
import { BubblePickerModal } from "../dialogs/bubble-picker-modal";

export function DirectoryPanel({
  conversation,
  members,
  files,
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
}: DirectoryPanelProps) {
  const { t } = useI18n();
  const {
    theme,
    currentPreset,
    currentBubblePreset,
    setIsWallpaperPickerOpen,
    setIsEmojiPickerOpen,
    setIsBubblePickerOpen,
  } = useConversationTheme();

  // State cho việc đóng/mở (collapse) từng section
  const [isAboutOpen, setIsAboutOpen] = useState(true);
  const [isMembersOpen, setIsMembersOpen] = useState(true);
  const [isFilesOpen, setIsFilesOpen] = useState(true);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Xem tất cả hay thu gọn danh sách thành viên & files
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Settings states
  const [isMuted, setIsMuted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Trạng thái thu gọn / mở rộng toàn bộ panel
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed =
    isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const isGroup = !!conversation?.isGroup;
  const user = conversation?.user || {
    id: "unknown",
    name: "Unknown",
    avatar: "",
    status: "offline" as const,
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Lọc số lượng hiển thị khi thu gọn
  const displayedMembers = showAllMembers ? members : members.slice(0, 4);
  const displayedFiles = showAllFiles ? files : files.slice(0, 3);

  // Khi đang ở trạng thái thu gọn hoàn toàn
  if (isCollapsed) {
    return (
      <aside className="w-16 shrink-0 h-full bg-white dark:bg-[#11131f] flex flex-col items-center justify-between border-l border-border dark:border-white/10 select-none py-6 transition-all duration-300">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Nút mở lại directory */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={t.openDirectory}
            className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center hover:bg-primary-soft-hover active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <PanelRightOpen className="w-5 h-5 stroke-2" />
          </button>

          {/* Avatar thu gọn */}
          <div className="pt-2 border-t border-border dark:border-white/10 w-10 flex justify-center">
            <UserAvatar
              src={
                isGroup ? conversation.groupAvatar || user.avatar : user.avatar
              }
              name={isGroup ? conversation.groupName || user.name : user.name}
              size="sm"
              shape="rounded"
              showStatus={!isGroup}
              status={user.status}
              className="w-9 h-9 rounded-xl"
            />
          </div>

          {/* Các nút xem nhanh khi thu gọn */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={t.files}
            className="w-9 h-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 stroke-2" />
          </button>

          {isGroup && (
            <button
              type="button"
              onClick={toggleCollapse}
              title={t.teamMembers}
              className="w-9 h-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 stroke-2" />
            </button>
          )}
        </div>

        {/* Nút info dưới đáy */}
        <button
          type="button"
          onClick={toggleCollapse}
          title={t.openDirectory}
          className="w-9 h-9 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Info className="w-4 h-4 stroke-2" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-85 xl:w-90 shrink-0 h-full bg-white dark:bg-[#11131f] flex flex-col border-l border-border dark:border-white/10 select-none overflow-hidden transition-all duration-300">
      {/* Top Header */}
      <div className="h-21 px-6 flex items-center justify-between border-b border-border dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[19px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {isGroup ? t.groupInfo : t.directory}
          </h2>
          {isGroup && (
            <span className="px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[11px] font-bold uppercase">
              Group
            </span>
          )}
        </div>

        {/* Nút thu gọn / đóng directory */}
        <button
          type="button"
          onClick={toggleCollapse}
          title={t.closeDirectory}
          className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center hover:bg-primary-soft-hover active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <PanelRightClose className="w-5 h-5 stroke-2" />
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* 1. PROFILE / GROUP CARD OVERVIEW                          */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-zinc-50/70 dark:bg-[#151824] border border-border/80 dark:border-white/10">
          <div className="relative mb-3">
            <UserAvatar
              src={
                isGroup ? conversation.groupAvatar || user.avatar : user.avatar
              }
              name={isGroup ? conversation.groupName || user.name : user.name}
              size="xl"
              shape="rounded"
              showStatus={!isGroup}
              status={user.status}
              previewable
              className="w-20 h-20 rounded-2xl shadow-xs"
            />
          </div>

          <h3 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {isGroup ? conversation.groupName || user.name : user.name}
          </h3>

          <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isGroup
              ? `${conversation.memberCount || members.length} ${t.members.toLowerCase()}`
              : user.username || user.name}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-center gap-2 mt-4 w-full">
            <button
              type="button"
              title={t.call}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white dark:bg-[#1c2030] hover:bg-primary-soft dark:hover:bg-primary-soft/20 hover:text-primary text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 transition-all text-xs font-semibold gap-1 active:scale-95 shadow-2xs cursor-pointer"
            >
              <Phone className="w-4 h-4 text-primary stroke-2" />
            </button>

            <button
              type="button"
              title={t.videoCall}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white dark:bg-[#1c2030] hover:bg-primary-soft dark:hover:bg-primary-soft/20 hover:text-primary text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 transition-all text-xs font-semibold gap-1 active:scale-95 shadow-2xs cursor-pointer"
            >
              <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-2" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={t.muteNotifications}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-xs font-semibold gap-1 active:scale-95 shadow-2xs cursor-pointer",
                isMuted
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                  : "bg-white dark:bg-[#1c2030] text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100/70 dark:hover:bg-white/10",
              )}
            >
              {isMuted ? (
                <BellOff className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-2" />
              ) : (
                <Bell className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-2" />
              )}
            </button>

            <button
              type="button"
              title={t.searchInChat}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white dark:bg-[#1c2030] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 transition-all text-xs font-semibold gap-1 active:scale-95 shadow-2xs cursor-pointer"
            >
              <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-2" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CHI TIẾT THÔNG TIN LIÊN HỆ / ABOUT (COLLAPSIBLE)      */}
        {/* ========================================================= */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className="flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-primary transition-colors stroke-2" />
              <h4 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                {isGroup ? t.aboutGroup : t.contactInfo}
              </h4>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-200 stroke-2",
                isAboutOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>

          {isAboutOpen && (
            <div className="mt-2 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#151824] border border-border/80 dark:border-white/10 flex flex-col gap-3 text-xs text-zinc-600 dark:text-zinc-400 animate-in fade-in-50 duration-150">
              {isGroup ? (
                <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {conversation.description ||
                    "Official team channel for collaboration, discussions, and sprint updates."}
                </p>
              ) : (
                <>
                  {/* Bio */}
                  {user.bio && (
                    <div className="pb-2 border-b border-border/60 dark:border-white/10">
                      <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                        {t.bio}
                      </span>
                      <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {user.bio}
                      </p>
                    </div>
                  )}

                  {/* Username */}
                  {user.username && (
                    <div className="flex items-center justify-between group/row">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AtSign className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 stroke-2" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                            {t.username}
                          </span>
                          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {user.username}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.username || "", "user")}
                        title={t.copy}
                        className="text-zinc-400 hover:text-primary transition-colors p-1"
                      >
                        {copiedKey === "user" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-2" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 stroke-2 opacity-60 group-hover/row:opacity-100" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Email */}
                  {user.email && (
                    <div className="flex items-center justify-between group/row">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 stroke-2" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                            Email
                          </span>
                          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.email || "", "email")}
                        title={t.copy}
                        className="text-zinc-400 hover:text-primary transition-colors p-1"
                      >
                        {copiedKey === "email" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-2" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 stroke-2 opacity-60 group-hover/row:opacity-100" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Phone */}
                  {user.phone && (
                    <div className="flex items-center justify-between group/row">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 stroke-2" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                            Phone
                          </span>
                          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {user.phone}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.phone || "", "phone")}
                        title={t.copy}
                        className="text-zinc-400 hover:text-primary transition-colors p-1"
                      >
                        {copiedKey === "phone" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-2" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 stroke-2 opacity-60 group-hover/row:opacity-100" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Location */}
                  {user.location && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 stroke-2" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                          Location
                        </span>
                        <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {user.location}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. TEAM MEMBERS SECTION - CHỈ HIỂN THỊ KHI LÀ GROUP       */}
        {/* ========================================================= */}
        {isGroup && (
          <>
            <hr className="border-t border-border dark:border-white/10" />
            <div className="flex flex-col">
              <div className="flex items-center justify-between py-2">
                <button
                  type="button"
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  className="flex items-center gap-2 cursor-pointer group flex-1 text-left"
                >
                  <Users className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-primary transition-colors stroke-2" />
                  <h4 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                    {t.teamMembers}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold">
                    {members.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-200 stroke-2 ml-auto mr-2",
                      isMembersOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>

                <button
                  type="button"
                  title={t.addMember}
                  className="w-7 h-7 rounded-lg bg-primary-soft text-primary hover:bg-primary-soft-hover flex items-center justify-center transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-2" />
                </button>
              </div>

              {isMembersOpen && (
                <div className="flex flex-col gap-1 mt-1.5 animate-in fade-in-50 duration-150">
                  {displayedMembers.map((member) => (
                    <MemberItem key={member.id} member={member} />
                  ))}

                  {members.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMembers(!showAllMembers)}
                      className="mt-1 py-1.5 px-3 text-left text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary-soft/40 rounded-lg transition-colors cursor-pointer w-fit"
                    >
                      {showAllMembers
                        ? t.showLess
                        : `${t.showAll} (${members.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <hr className="border-t border-border dark:border-white/10" />

        {/* ========================================================= */}
        {/* 4. SHARED FILES SECTION (COLLAPSIBLE)                     */}
        {/* ========================================================= */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsFilesOpen(!isFilesOpen)}
            className="flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-primary transition-colors stroke-2" />
              <h4 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                {t.files}
              </h4>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold">
                125
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-200 stroke-2",
                isFilesOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>

          {isFilesOpen && (
            <div className="flex flex-col gap-1 mt-1.5 animate-in fade-in-50 duration-150">
              {displayedFiles.map((file) => (
                <FileItem key={file.id} file={file} />
              ))}

              {files.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="mt-1 py-1.5 px-3 text-left text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary-soft/40 rounded-lg transition-colors cursor-pointer w-fit"
                >
                  {showAllFiles ? t.showLess : `${t.showAll} (125)`}
                </button>
              )}
            </div>
          )}
        </div>

        <hr className="border-t border-border dark:border-white/10" />

        {/* ========================================================= */}
        {/* 5. PINNED MESSAGES SECTION (COLLAPSIBLE)                  */}
        {/* ========================================================= */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsPinnedOpen(!isPinnedOpen)}
            className="flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-primary transition-colors stroke-2" />
              <h4 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                {t.pinnedMessages}
              </h4>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold">
                {conversation.pinnedCount || 3}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-200 stroke-2",
                isPinnedOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>

          {isPinnedOpen && (
            <div className="mt-2 flex flex-col gap-2 animate-in fade-in-50 duration-150">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#151824] border border-border/80 dark:border-white/10 text-xs flex flex-col gap-1">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Sprint Planning Timeline
                </span>
                <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  Deadline for UI Kit v1.0 submission is Friday 5:00 PM.
                </p>
              </div>
            </div>
          )}
        </div>

        <hr className="border-t border-border dark:border-white/10" />

        {/* ========================================================= */}
        {/* 6. CONVERSATION SETTINGS & PRIVACY                        */}
        {/* ========================================================= */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-primary transition-colors stroke-2" />
              <h4 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                {t.conversationSettings}
              </h4>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-200 stroke-2",
                isSettingsOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>

          {isSettingsOpen && (
            <div className="mt-2.5 flex flex-col gap-3.5 animate-in fade-in-50 duration-150">
              {/* End to end encryption notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#DCFCE7] dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-2" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-snug">
                    {t.encryption}
                  </span>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-snug mt-0.5">
                    {t.encryptionDesc}
                  </span>
                </div>
              </div>

              {/* Theme & Customization Settings */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                  Tùy chỉnh trò chuyện
                </span>

                {/* Default Emoji Setting Row */}
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(true)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151824] hover:bg-zinc-100/70 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                      <Smile className="w-4 h-4 stroke-2" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors truncate">
                        {t.defaultEmoji}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                        Phản hồi nhanh 1 chạm
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1c2030] border border-zinc-200 dark:border-white/10 shadow-2xs flex items-center justify-center text-base group-hover:scale-110 transition-transform">
                      {theme.defaultEmoji}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>

                {/* Chat Wallpaper Setting Row */}
                <button
                  type="button"
                  onClick={() => setIsWallpaperPickerOpen(true)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151824] hover:bg-zinc-100/70 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-primary border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4 stroke-2" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors truncate">
                        {t.chatWallpaper}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                        {typeof t[currentPreset.nameKey] === "string"
                          ? (t[currentPreset.nameKey] as string)
                          : currentPreset.nameFallback}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-7 h-7 rounded-lg border border-zinc-300 dark:border-white/20 shadow-2xs group-hover:scale-110 transition-transform overflow-hidden"
                      style={{
                        background: currentPreset.previewBg,
                        ...(currentPreset.style || {}),
                      }}
                    />
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>

                {/* Bubble Style Setting Row */}
                <button
                  type="button"
                  onClick={() => setIsBubblePickerOpen(true)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151824] hover:bg-zinc-100/70 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 stroke-2" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors truncate">
                        {t.bubbleStyle}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                        {currentBubblePreset.nameFallback} • {currentBubblePreset.iconEmoji}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/20 shadow-2xs group-hover:scale-110 transition-transform flex items-center justify-center text-xs overflow-hidden"
                      style={{ background: currentBubblePreset.previewBg }}
                    >
                      <span className="text-white drop-shadow-xs text-[11px] leading-none">
                        {currentBubblePreset.iconEmoji}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              </div>

              {/* Danger Zone Actions */}
              <div className="flex flex-col gap-1.5 pt-2">
                {isGroup ? (
                  <button
                    type="button"
                    className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-xs font-semibold text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-2" />
                    <span>{t.leaveGroup}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-xs font-semibold text-left cursor-pointer"
                  >
                    <Ban className="w-4 h-4 stroke-2" />
                    <span>{t.blockUser}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-xs font-semibold text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 stroke-2" />
                  <span>{t.deleteChat}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallpaper, Emoji and Bubble Dialogs */}
      <WallpaperPickerModal />
      <DefaultEmojiModal />
      <BubblePickerModal />
    </aside>
  );
}
