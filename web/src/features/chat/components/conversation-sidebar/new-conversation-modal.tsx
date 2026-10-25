"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { conversationService } from "@/services/conversation.service";
import { useConversationsContext } from "../../context/conversations-context";
import { normalizeConversation } from "../../hooks/use-conversations";
import { useFindUsers } from "../../hooks/use-find-users";
import { UserAvatar } from "../shared/user-avatar";
import { cn } from "@/lib/utils";
import type {
  CreateGroupFormValues,
  NewConversationModalProps,
  User,
} from "@/type";

const DEFAULT_DIRECT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop";
const DEFAULT_GROUP_AVATAR =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop";

/* -------------------------------------------------------------------------- */
/* Subcomponent: DirectContactItem (Memoized to prevent list re-renders)     */
/* -------------------------------------------------------------------------- */

interface DirectContactItemProps {
  contact: User;
  isCreating: boolean;
  disabled: boolean;
  onSelect: (contact: User) => void;
  locale: string;
  sendLabel: string;
}

const DirectContactItem = memo(function DirectContactItem({
  contact,
  isCreating,
  disabled,
  onSelect,
  locale,
  sendLabel,
}: DirectContactItemProps) {
  const handleClick = useCallback(() => {
    onSelect(contact);
  }, [contact, onSelect]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="cursor-pointer w-full p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-200/60 dark:active:bg-white/10 disabled:opacity-60 flex items-center justify-between text-left transition-colors group"
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
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors truncate">
              {contact.name}
            </span>
            {contact.phone ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {contact.phone}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {contact.email ||
              contact.bio ||
              (locale === "vi" ? "Thành viên" : "Member")}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 transition-opacity pr-2",
          isCreating ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {isCreating ? (
          <span className="inline-flex items-center justify-center animate-spin text-primary">
            <Loader2 className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-xs font-semibold text-primary bg-primary-soft dark:bg-primary/20 border border-primary/20 px-2.5 py-1 rounded-lg shadow-2xs">
            {sendLabel}
          </span>
        )}
      </div>
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* Subcomponent: GroupContactItem (Memoized to prevent list re-renders)      */
/* -------------------------------------------------------------------------- */

interface GroupContactItemProps {
  contact: User;
  isSelected: boolean;
  disabled: boolean;
  onToggle: (contact: User) => void;
  locale: string;
}

const GroupContactItem = memo(function GroupContactItem({
  contact,
  isSelected,
  disabled,
  onToggle,
  locale,
}: GroupContactItemProps) {
  const handleClick = useCallback(() => {
    onToggle(contact);
  }, [contact, onToggle]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "cursor-pointer w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors border",
        isSelected
          ? "bg-primary-soft dark:bg-primary/20 border-primary/30"
          : "hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-200/60 dark:active:bg-white/10 border-transparent"
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
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
              {contact.name}
            </span>
            {contact.phone ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {contact.phone}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
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
            ? "bg-primary border-primary text-white shadow-xs"
            : "border-zinc-300 dark:border-white/20 bg-white dark:bg-[#1c2030]"
        )}
      >
        {isSelected ? <Check className="w-3.5 h-3.5 stroke-3" /> : null}
      </div>
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* Subcomponent: SelectedMemberChip (Memoized)                               */
/* -------------------------------------------------------------------------- */

interface SelectedMemberChipProps {
  user: User;
  onRemove: (userId: string) => void;
}

const SelectedMemberChip = memo(function SelectedMemberChip({
  user,
  onRemove,
}: SelectedMemberChipProps) {
  const handleRemove = useCallback(() => {
    onRemove(user.id);
  }, [onRemove, user.id]);

  return (
    <span className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-primary-soft dark:bg-primary/20 border border-primary/25 text-primary text-xs font-medium shadow-2xs">
      <UserAvatar
        src={user.avatar}
        name={user.name}
        size="sm"
        className="w-4 h-4"
      />
      <span className="max-w-30 truncate text-zinc-900 dark:text-zinc-100">{user.name}</span>
      <button
        type="button"
        onClick={handleRemove}
        className="cursor-pointer text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
});

/* -------------------------------------------------------------------------- */
/* Subcomponent: InfiniteScrollSentinel (Observer replaces scroll thrashing)  */
/* -------------------------------------------------------------------------- */

interface InfiniteScrollSentinelProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const InfiniteScrollSentinel = memo(function InfiniteScrollSentinel({
  containerRef,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: container,
        rootMargin: "80px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [containerRef, hasMore, isLoading, isLoadingMore, onLoadMore]);

  if (!hasMore) return null;
  return <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />;
});

/* -------------------------------------------------------------------------- */
/* Main Modal Component                                                       */
/* -------------------------------------------------------------------------- */

export function NewConversationModal({
  isOpen,
  onClose,
  onSuccess,
}: NewConversationModalProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { conversations, addOrUpdateConversation } = useConversationsContext();

  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [creatingDirectUserId, setCreatingDirectUserId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const directListScrollRef = useRef<HTMLDivElement>(null);
  const groupListScrollRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Narrow effect/memo dependencies: use primitive values (Rule 5.3)
  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name;
  const currentUserEmail = currentUser?.email;

  const filteredContacts = useMemo(() => {
    if (!currentUserId && !currentUserEmail) return users;
    return users.filter(
      (u) =>
        u.id !== currentUserId &&
        (!currentUserEmail || u.email !== currentUserEmail)
    );
  }, [users, currentUserId, currentUserEmail]);

  // Index map of direct conversations for O(1) lookup (Rule 7.2 & 7.11)
  const directConversationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of conversations) {
      if (c.isGroup) continue;
      if (c.id) map.set(c.id, c.id);
      if (c.user?.id) map.set(c.user.id, c.id);
      if (c.memberIds) {
        for (const mId of c.memberIds) {
          if (mId && mId !== currentUserId) {
            map.set(mId, c.id);
          }
        }
      }
      if (c.user?.name) {
        map.set(`name:${c.user.name.toLowerCase().trim()}`, c.id);
      }
    }
    return map;
  }, [conversations, currentUserId]);

  // Set for O(1) membership check during list rendering (Rule 7.11)
  const selectedUserIdsSet = useMemo(
    () => new Set(selectedUsers.map((u) => u.id)),
    [selectedUsers]
  );

  const toggleSelectUser = useCallback((user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
    });
  }, []);

  const removeSelectedUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const buildMemberIds = useCallback(
    (targetIds: string[]): string[] => {
      const rawIds = currentUserId ? [currentUserId, ...targetIds] : targetIds;
      return Array.from(new Set(rawIds.filter(Boolean)));
    },
    [currentUserId]
  );

  const handleStartDirect = useCallback(
    async (contact: User) => {
      if (creatingDirectUserId) return;

      // O(1) indexed lookup for existing direct conversation (Rule 7.2)
      const existingId =
        directConversationMap.get(contact.id) ||
        (contact.name
          ? directConversationMap.get(`name:${contact.name.toLowerCase().trim()}`)
          : undefined);
      if (existingId) {
        onClose();
        router.push(`/messages/${existingId}`);
        return;
      }

      setCreatingDirectUserId(contact.id);
      setSubmitError(null);

      try {
        const currentName = currentUserName?.trim() || "Người dùng";
        const partnerName = contact.name?.trim() || "Người dùng";
        // groupName là tên của 2 người ghép lại
        const combinedGroupName = `${currentName}, ${partnerName}`;

        const memberIds = buildMemberIds([contact.id]);
        const res = await conversationService.createConversation({
          isGroup: false,
          groupName: combinedGroupName,
          groupAvatar: contact.avatar || DEFAULT_DIRECT_AVATAR,
          description: `Cuộc trò chuyện giữa ${combinedGroupName}`,
          tags: ["direct"],
          memberIds,
        });

        const createdRaw = res?.data;
        if (createdRaw?.id) {
          addOrUpdateConversation(
            normalizeConversation(createdRaw, currentUserId, currentUserName)
          );
          onClose();
          onSuccess?.();
          router.push(`/messages/${createdRaw.id}`);
          return;
        }

        onClose();
        router.push(`/messages/${contact.id}`);
      } catch (err) {
        console.error("Failed to create direct conversation:", err);
        onClose();
        router.push(`/messages/${contact.id}`);
      } finally {
        setCreatingDirectUserId(null);
      }
    },
    [
      creatingDirectUserId,
      directConversationMap,
      onClose,
      router,
      buildMemberIds,
      addOrUpdateConversation,
      currentUserId,
      currentUserName,
      onSuccess,
    ]
  );

  const handleCreateGroup = useCallback(
    async (data: CreateGroupFormValues) => {
      const trimmedGroupName = data.groupName.trim();
      const targetIds = selectedUsers.map((u) => u.id);

      if (!trimmedGroupName || targetIds.length === 0 || isCreatingGroup) {
        return;
      }

      setIsCreatingGroup(true);
      setSubmitError(null);

      try {
        const allMemberIds = buildMemberIds(targetIds);

        const res = await conversationService.createConversation({
          isGroup: true,
          groupName: trimmedGroupName,
          groupAvatar: DEFAULT_GROUP_AVATAR,
          description: `Nhóm thảo luận ${trimmedGroupName}`,
          tags: ["group"],
          memberIds: allMemberIds,
        });

        const createdRaw = res?.data;
        if (createdRaw?.id) {
          addOrUpdateConversation(
            normalizeConversation(createdRaw, currentUserId, currentUserName)
          );
        }

        const conversationId =
          createdRaw?.id ||
          `group-${
            trimmedGroupName
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "") || "custom"
          }`;

        onClose();
        onSuccess?.();
        resetGroupForm();
        setSelectedUsers([]);
        router.push(`/messages/${conversationId}`);
      } catch (err) {
        console.error("Failed to create group conversation:", err);
        setSubmitError(
          locale === "vi"
            ? "Không thể tạo nhóm trò chuyện. Vui lòng thử lại."
            : "Failed to create group conversation. Please try again."
        );
      } finally {
        setIsCreatingGroup(false);
      }
    },
    [
      selectedUsers,
      isCreatingGroup,
      buildMemberIds,
      addOrUpdateConversation,
      onClose,
      onSuccess,
      resetGroupForm,
      router,
      locale,
      currentUserId,
      currentUserName,
    ]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Card */}
      <div
        className="bg-white dark:bg-[#151824] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t.newMessage}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {mode === "direct" ? t.selectContact : t.groupChat}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-zinc-200/80 dark:border-white/10 shrink-0">
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200/60 dark:border-transparent">
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={cn(
                "cursor-pointer flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                mode === "direct"
                  ? "bg-white dark:bg-[#1c2030] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/80 dark:border-transparent"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
                  ? "bg-white dark:bg-[#1c2030] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/80 dark:border-transparent"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              {t.groupChat}
            </button>
          </div>
        </div>

        {/* DIRECT MESSAGE MODE */}
        {mode === "direct" ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    locale === "vi"
                      ? "Tìm theo tên, email, số điện thoại..."
                      : t.searchContacts
                  }
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100/70 dark:bg-white/5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-[#1c2030] focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
                {isLoading ? (
                  <span className="inline-flex items-center justify-center animate-spin text-primary absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4" />
                  </span>
                ) : null}
              </div>
            </div>

            {/* Contacts List with IntersectionObserver Pagination */}
            <div
              ref={directListScrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-1"
            >
              {error && users.length === 0 ? (
                <div className="py-12 text-center text-xs text-rose-500">
                  {error}
                </div>
              ) : isLoading && users.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center justify-center animate-spin text-primary">
                    <Loader2 className="w-6 h-6" />
                  </span>
                  <span>
                    {locale === "vi"
                      ? "Đang tìm kiếm người dùng..."
                      : "Searching users..."}
                  </span>
                </div>
              ) : filteredContacts.length > 0 ? (
                <>
                  {filteredContacts.map((contact) => (
                    <DirectContactItem
                      key={contact.id}
                      contact={contact}
                      isCreating={creatingDirectUserId === contact.id}
                      disabled={Boolean(creatingDirectUserId)}
                      onSelect={handleStartDirect}
                      locale={locale}
                      sendLabel={t.send}
                    />
                  ))}

                  <InfiniteScrollSentinel
                    containerRef={directListScrollRef}
                    hasMore={hasMore}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                  />

                  {isLoadingMore ? (
                    <div className="py-3 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center justify-center animate-spin text-primary">
                        <Loader2 className="w-4 h-4" />
                      </span>
                      <span>
                        {locale === "vi"
                          ? "Đang tải thêm..."
                          : "Loading more..."}
                      </span>
                    </div>
                  ) : null}

                  {!hasMore && filteredContacts.length > 5 ? (
                    <div className="py-2.5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                      {locale === "vi"
                        ? "Đã hiển thị tất cả người dùng"
                        : "All contacts loaded"}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {locale === "vi"
                    ? "Không tìm thấy người dùng phù hợp."
                    : "No matching contacts found."}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* GROUP CHAT MODE */}
        {mode === "group" ? (
          <form
            onSubmit={handleSubmit(handleCreateGroup)}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Group Name Field */}
            <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 space-y-3 shrink-0">
              <div>
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                  {t.groupName}
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t.groupNamePlaceholder}
                    {...register("groupName", { required: true })}
                    className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100/70 dark:bg-[#1c2030] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-[#1c2030] focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Selected chips preview */}
              {selectedUsers.length > 0 ? (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                    {t.selectedMembers} ({selectedUsers.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {selectedUsers.map((user) => (
                      <SelectedMemberChip
                        key={user.id}
                        user={user}
                        onRemove={removeSelectedUser}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Contact selector search */}
            <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-white/10 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    locale === "vi"
                      ? "Tìm theo tên, email, số điện thoại..."
                      : t.searchContacts
                  }
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-100/70 dark:bg-white/5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-[#1c2030] transition-all"
                />
                {isLoading ? (
                  <span className="inline-flex items-center justify-center animate-spin text-primary absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5" />
                  </span>
                ) : null}
              </div>
            </div>

            {/* Selectable Contacts List with IntersectionObserver Pagination */}
            <div
              ref={groupListScrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-1"
            >
              {error && users.length === 0 ? (
                <div className="py-12 text-center text-xs text-rose-500">
                  {error}
                </div>
              ) : isLoading && users.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center justify-center animate-spin text-primary">
                    <Loader2 className="w-6 h-6" />
                  </span>
                  <span>
                    {locale === "vi"
                      ? "Đang tìm kiếm người dùng..."
                      : "Searching users..."}
                  </span>
                </div>
              ) : filteredContacts.length > 0 ? (
                <>
                  {filteredContacts.map((contact) => (
                    <GroupContactItem
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedUserIdsSet.has(contact.id)}
                      disabled={isCreatingGroup}
                      onToggle={toggleSelectUser}
                      locale={locale}
                    />
                  ))}

                  <InfiniteScrollSentinel
                    containerRef={groupListScrollRef}
                    hasMore={hasMore}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                  />

                  {isLoadingMore ? (
                    <div className="py-3 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center justify-center animate-spin text-primary">
                        <Loader2 className="w-4 h-4" />
                      </span>
                      <span>
                        {locale === "vi"
                          ? "Đang tải thêm..."
                          : "Loading more..."}
                      </span>
                    </div>
                  ) : null}

                  {!hasMore && filteredContacts.length > 5 ? (
                    <div className="py-2.5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                      {locale === "vi"
                        ? "Đã hiển thị tất cả người dùng"
                        : "All contacts loaded"}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {locale === "vi"
                    ? "Không tìm thấy người dùng phù hợp."
                    : "No matching contacts found."}
                </div>
              )}
            </div>

            {submitError ? (
              <div className="px-4 py-2 text-xs text-rose-500 bg-rose-500/10 border-t border-rose-500/20">
                {submitError}
              </div>
            ) : null}

            {/* Footer Buttons */}
            <div className="p-4 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-[#11131c] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreatingGroup}
                className="cursor-pointer px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-200/60 shadow-2xs transition-all"
              >
                {t.cancel}
              </button>

              <button
                type="submit"
                disabled={
                  !groupName.trim() ||
                  selectedUsers.length === 0 ||
                  isCreatingGroup
                }
                className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                {isCreatingGroup ? (
                  <span className="inline-flex items-center justify-center animate-spin">
                    <Loader2 className="w-3.5 h-3.5" />
                  </span>
                ) : null}
                {t.createGroup}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
