"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  Check,
  Hash,
  Loader2,
  Search,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useFindUsers } from "../../hooks/use-find-users";
import { UserAvatar } from "../shared/user-avatar";
import { cn } from "@/lib/utils";
import type {
  CreateGroupFormValues,
  NewConversationModalProps,
  User,
} from "@/type";

export function NewConversationModal({
  isOpen,
  onClose,
}: NewConversationModalProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersMap, setSelectedUsersMap] = useState<
    Record<string, User>
  >({});

  const {
    users,
    searchQuery,
    setSearchQuery,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
  } = useFindUsers({ enabled: isOpen });

  // React Hook Form for Group Chat creation
  const {
    register,
    handleSubmit,
    control,
    reset: resetGroupForm,
  } = useForm<CreateGroupFormValues>({
    defaultValues: {
      groupName: "",
    },
  });

  const groupName = useWatch({ control, name: "groupName" }) || "";

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter out the current logged-in user
  const filteredContacts = useMemo(() => {
    return users.filter(
      (u) =>
        u.id !== currentUser?.id &&
        (!currentUser?.email || u.email !== currentUser.email),
    );
  }, [users, currentUser]);

  if (!isOpen) return null;

  const handleStartDirect = (userId: string) => {
    onClose();
    router.push(`/messages/${userId}`);
  };

  const toggleSelectUser = (user: User) => {
    setSelectedUserIds((prev) => {
      const exists = prev.includes(user.id);
      if (exists) {
        return prev.filter((id) => id !== user.id);
      } else {
        setSelectedUsersMap((map) => ({ ...map, [user.id]: user }));
        return [...prev, user.id];
      }
    });
  };

  const handleCreateGroup = (data: CreateGroupFormValues) => {
    if (!data.groupName.trim() || selectedUserIds.length === 0) return;

    const slug = data.groupName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const groupId = `group-${slug || "custom"}`;
    onClose();
    resetGroupForm();
    setSelectedUserIds([]);
    setSelectedUsersMap({});
    router.push(`/messages/${groupId}`);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop - clientHeight < 60 &&
      hasMore &&
      !isLoading &&
      !isLoadingMore
    ) {
      loadMore();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Card */}
      <div
        className="bg-card dark:bg-[#151824] rounded-2xl border border-border dark:border-white/10 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-border dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t.newMessage}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "direct" ? t.selectContact : t.groupChat}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-border/60 dark:border-white/10 shrink-0">
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={cn(
                "cursor-pointer flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                mode === "direct"
                  ? "bg-white dark:bg-[#1c2030] text-foreground shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-foreground",
              )}
            >
              <UserIcon className="w-3.5 h-3.5" />
              {t.directMessage}
            </button>

            <button
              type="button"
              onClick={() => setMode("group")}
              className={cn(
                "cursor-pointer flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                mode === "group"
                  ? "bg-white dark:bg-[#1c2030] text-foreground shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-foreground",
              )}
            >
              <Users className="w-3.5 h-3.5" />
              {t.groupChat}
            </button>
          </div>
        </div>

        {/* DIRECT MESSAGE MODE */}
        {mode === "direct" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="p-4 border-b border-border/60 dark:border-white/10 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    locale === "vi"
                      ? "Tìm theo tên, email, số điện thoại..."
                      : t.searchContacts
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 text-foreground placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-[#1c2030] focus:ring-3 focus:ring-primary/10 transition-all"
                  autoFocus
                />
                {isLoading && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            {/* Contacts List with Scroll Pagination */}
            <div
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3 space-y-1"
            >
              {error && users.length === 0 ? (
                <div className="py-12 text-center text-xs text-rose-500">
                  {error}
                </div>
              ) : isLoading && users.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span>
                    {locale === "vi"
                      ? "Đang tìm kiếm người dùng..."
                      : "Searching users..."}
                  </span>
                </div>
              ) : filteredContacts.length > 0 ? (
                <>
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleStartDirect(contact.id)}
                      className="cursor-pointer w-full p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-between text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          src={contact.avatar}
                          name={contact.name}
                          size="md"
                          showStatus
                          status={contact.status}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {contact.name}
                            </span>
                            {contact.phone && (
                              <span className="text-xs text-zinc-400 font-normal">
                                {contact.phone}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.email ||
                              contact.bio ||
                              (locale === "vi" ? "Thành viên" : "Member")}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <span className="text-xs font-semibold text-primary bg-primary-soft dark:bg-primary/20 px-2.5 py-1 rounded-lg">
                          {t.send}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <div className="py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span>
                        {locale === "vi"
                          ? "Đang tải thêm..."
                          : "Loading more..."}
                      </span>
                    </div>
                  )}

                  {!hasMore && filteredContacts.length > 5 && (
                    <div className="py-2.5 text-center text-[11px] text-zinc-400">
                      {locale === "vi"
                        ? "Đã hiển thị tất cả người dùng"
                        : "All contacts loaded"}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  {locale === "vi"
                    ? "Không tìm thấy người dùng phù hợp."
                    : "No matching contacts found."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GROUP CHAT MODE */}
        {mode === "group" && (
          <form
            onSubmit={handleSubmit(handleCreateGroup)}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Group Name Field */}
            <div className="p-4 border-b border-border/60 dark:border-white/10 space-y-3 shrink-0">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  {t.groupName}
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t.groupNamePlaceholder}
                    {...register("groupName", { required: true })}
                    className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Selected chips preview */}
              {selectedUserIds.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    {t.selectedMembers} ({selectedUserIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {selectedUserIds.map((id) => {
                      const u =
                        selectedUsersMap[id] ||
                        filteredContacts.find((x) => x.id === id);
                      if (!u) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-lg bg-primary-soft dark:bg-primary/20 text-primary text-xs font-medium"
                        >
                          <UserAvatar
                            src={u.avatar}
                            name={u.name}
                            size="sm"
                            className="w-4 h-4"
                          />
                          <span className="max-w-30 truncate">{u.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleSelectUser(u)}
                            className="cursor-pointer hover:text-rose-600 transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Contact selector search */}
            <div className="px-4 py-2 border-b border-border/60 dark:border-white/10 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    locale === "vi"
                      ? "Tìm theo tên, email, số điện thoại..."
                      : t.searchContacts
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-3 pr-8 text-xs rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 text-foreground placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-[#1c2030] transition-all"
                />
                {isLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            {/* Selectable Contacts List with Scroll Pagination */}
            <div
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3 space-y-1"
            >
              {error && users.length === 0 ? (
                <div className="py-12 text-center text-xs text-rose-500">
                  {error}
                </div>
              ) : isLoading && users.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span>
                    {locale === "vi"
                      ? "Đang tìm kiếm người dùng..."
                      : "Searching users..."}
                  </span>
                </div>
              ) : filteredContacts.length > 0 ? (
                <>
                  {filteredContacts.map((contact) => {
                    const isSelected = selectedUserIds.includes(contact.id);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => toggleSelectUser(contact)}
                        className={cn(
                          "cursor-pointer w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors",
                          isSelected
                            ? "bg-primary-soft/50 dark:bg-primary/20 border border-primary/20"
                            : "hover:bg-zinc-50 dark:hover:bg-white/5",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            src={contact.avatar}
                            name={contact.name}
                            size="md"
                            showStatus
                            status={contact.status}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate block">
                                {contact.name}
                              </span>
                              {contact.phone && (
                                <span className="text-xs text-zinc-400 font-normal">
                                  {contact.phone}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.email ||
                                contact.bio ||
                                (locale === "vi" ? "Thành viên" : "Member")}
                            </p>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-zinc-300 dark:border-white/20 bg-white dark:bg-[#1c2030]",
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 stroke-3" />
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <div className="py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span>
                        {locale === "vi"
                          ? "Đang tải thêm..."
                          : "Loading more..."}
                      </span>
                    </div>
                  )}

                  {!hasMore && filteredContacts.length > 5 && (
                    <div className="py-2.5 text-center text-[11px] text-zinc-400">
                      {locale === "vi"
                        ? "Đã hiển thị tất cả người dùng"
                        : "All contacts loaded"}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  {locale === "vi"
                    ? "Không tìm thấy người dùng phù hợp."
                    : "No matching contacts found."}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-border dark:border-white/10 bg-zinc-50/60 dark:bg-[#11131c] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 shadow-2xs transition-all"
              >
                {t.cancel}
              </button>

              <button
                type="submit"
                disabled={!groupName.trim() || selectedUserIds.length === 0}
                className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
              >
                {t.createGroup}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
