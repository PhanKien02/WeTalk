"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { Camera, Check, LogOut, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { mockUsers } from "@/features/chat/data/mock-data";
import { cn } from "@/lib/utils";
import type {
  ChangeEmailValues,
  ChangePasswordValues,
  ProfileFormValues,
  ProfileTabProps,
} from "@/type";

export function ProfileTab({
  onShowToast,
  avatarSrc,
  setAvatarSrc,
  setPrevAvatarSrc,
}: ProfileTabProps) {
  const { locale, setLocale, t } = useI18n();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form initial state
  const initialData = {
    name: mockUsers.me.name || "Tuấn Khang",
    username: mockUsers.me.username || "@tuankhang_ux",
    roleTitle: "Product Designer & Lead",
    phone: mockUsers.me.phone || "+84 987 654 321",
    department: "Product & Engineering",
    bio:
      mockUsers.me.bio ||
      "Building intuitive interfaces and seamless real-time messaging experiences.",
  };

  const [currentDisplayName, setCurrentDisplayName] = useState(initialData.name);
  const [userEmail, setUserEmail] = useState(
    mockUsers.me.email || "khang.tuan@wetalk.io"
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // React Hook Form for Profile Info
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: initialData.name,
      username: initialData.username,
      roleTitle: initialData.roleTitle,
      phone: initialData.phone,
      department: initialData.department,
      bio: initialData.bio,
    },
  });

  // React Hook Form for Change Email
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    reset: resetEmailForm,
  } = useForm<ChangeEmailValues>({
    defaultValues: {
      newEmail: "",
    },
  });

  // React Hook Form for Change Password
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
  } = useForm<ChangePasswordValues>({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
    },
  });

  // Avatar states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Preferences
  const [timezone, setTimezone] = useState("GMT+07:00");
  const [savedTimezoneTime, setSavedTimezoneTime] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Handle avatar upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(
        locale === "vi"
          ? "Ảnh nặng hơn 2 MB. Vui lòng chọn ảnh nhỏ hơn."
          : "Image exceeds 2 MB. Please select a smaller file."
      );
      return;
    }

    setAvatarError(null);
    setIsUploadingAvatar(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        setPrevAvatarSrc(avatarSrc);
        setAvatarSrc(event.target?.result as string);
        setIsUploadingAvatar(false);
        onShowToast(
          locale === "vi"
            ? "Đã cập nhật ảnh đại diện."
            : "Profile photo updated successfully."
        );
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  // Handle avatar delete
  const handleDeleteAvatar = () => {
    if (!avatarSrc) return;
    setPrevAvatarSrc(avatarSrc);
    setAvatarSrc(null);
    onShowToast(
      locale === "vi" ? "Đã xoá ảnh đại diện." : "Profile photo removed.",
      true
    );
  };

  // Handle Save Profile
  const onSaveProfile = async (data: ProfileFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setCurrentDisplayName(data.name);
    reset(data);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const onChangeEmail = (data: ChangeEmailValues) => {
    if (!data.newEmail?.trim()) return;
    setUserEmail(data.newEmail.trim());
    setIsEmailModalOpen(false);
    resetEmailForm();
    onShowToast(
      locale === "vi"
        ? "Đã gửi liên kết xác nhận tới email mới."
        : "Confirmation email sent."
    );
  };

  const onChangePassword = () => {
    setIsPasswordModalOpen(false);
    resetPasswordForm();
    onShowToast(
      locale === "vi"
        ? "Đã đổi mật khẩu thành công."
        : "Password updated successfully."
    );
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    setSavedTimezoneTime(true);
    setTimeout(() => setSavedTimezoneTime(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Card 1: Personal Information */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {t.personalInfo}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.personalInfoSub}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSaveProfile)} className="divide-y divide-border/70 dark:divide-white/10">
          {/* Avatar Row */}
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Ảnh đại diện" : "Profile photo"}
            </span>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar preview */}
              <div className="relative group shrink-0">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl overflow-hidden bg-primary-soft dark:bg-primary/20 flex items-center justify-center font-bold text-xl text-primary border border-border/60 dark:border-white/10 transition-opacity",
                    isUploadingAvatar && "opacity-50"
                  )}
                >
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={currentDisplayName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>
                      {currentDisplayName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-all disabled:opacity-50 shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    {t.changeAvatar}
                  </button>

                  {avatarSrc && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={isUploadingAvatar}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                      {t.deleteAvatar}
                    </button>
                  )}
                </div>

                {avatarError ? (
                  <p className="text-xs text-rose-600 font-medium">
                    {avatarError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t.avatarHint}</p>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.fullName}
            </label>
            <div className="max-w-md">
              <input
                id="fullName"
                type="text"
                {...register("name", { required: true })}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.username}
            </label>
            <div className="max-w-md">
              <input
                id="username"
                type="text"
                {...register("username")}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Job Title */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="roleTitle"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.jobTitle}
            </label>
            <div className="max-w-md">
              <input
                id="roleTitle"
                type="text"
                {...register("roleTitle")}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.phoneNumber}
            </label>
            <div className="max-w-md">
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Department */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="department"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.department}
            </label>
            <div className="max-w-md">
              <input
                id="department"
                type="text"
                {...register("department")}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="bio"
              className="text-sm font-medium text-foreground pt-2"
            >
              {t.bio}
            </label>
            <div className="max-w-xl">
              <textarea
                id="bio"
                rows={3}
                {...register("bio")}
                className="w-full p-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Card Footer: Save Changes */}
          <div className="px-6 py-4 bg-zinc-50/70 dark:bg-[#11131c] flex items-center justify-between">
            <div>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {t.saved}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t.saveChanges
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Account & Credentials */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {locale === "vi" ? "Tài khoản & Đăng nhập" : "Sign-in & Credentials"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "vi"
              ? "Địa chỉ email và mật khẩu được sử dụng để đăng nhập vào WeTalk."
              : "Email address and security credentials used to sign in."}
          </p>
        </div>

        <div className="divide-y divide-border/70 dark:divide-white/10">
          {/* Email row */}
          <div className="grid gap-3 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">Email</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-mono text-foreground font-medium">
                  {userEmail}
                </span>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  ✓ {locale === "vi" ? "Đã xác thực" : "Verified"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="cursor-pointer self-start sm:self-auto inline-flex items-center px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-2xs"
              >
                {t.changeEmail}
              </button>
            </div>
          </div>

          {/* Password row */}
          <div className="grid gap-3 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Mật khẩu" : "Password"}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t.lastChanged} 12/06/2026
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="cursor-pointer self-start sm:self-auto inline-flex items-center px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-2xs"
              >
                {t.changePassword}
              </button>
            </div>
          </div>

          {/* Sign out session row */}
          <div className="grid gap-3 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">
              {t.signOut}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {locale === "vi"
                    ? "Đăng xuất khỏi phiên làm việc hiện tại trên thiết bị này."
                    : "Sign out of your active session on this device."}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Preferences (Auto-saved) */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {t.preferences}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "vi"
              ? "Cài đặt ngôn ngữ, múi giờ và trải nghiệm ứng dụng."
              : "Language, timezone, and app experience settings."}
          </p>
        </div>

        <div className="divide-y divide-border/70 dark:divide-white/10">
          {/* Language */}
          <div className="grid gap-3 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {locale === "vi" ? "Ngôn ngữ" : "Language"}
              </span>
            </div>

            <div className="max-w-xs">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as "vi" | "en")}
                className="cursor-pointer w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              >
                <option value="vi">Tiếng Việt (Vietnamese)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </div>

          {/* Timezone */}
          <div className="grid gap-3 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {locale === "vi" ? "Múi giờ" : "Timezone"}
              </span>
              {savedTimezoneTime && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  ✓ {t.saved}
                </span>
              )}
            </div>

            <div className="max-w-xs">
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="cursor-pointer w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              >
                <option value="GMT+07:00">
                  (GMT+07:00) Hà Nội, Bangkok, Jakarta
                </option>
                <option value="GMT+08:00">
                  (GMT+08:00) Singapore, Hong Kong
                </option>
                <option value="GMT-08:00">
                  (GMT-08:00) Pacific Time (US & Canada)
                </option>
                <option value="GMT-05:00">
                  (GMT-05:00) Eastern Time (US & Canada)
                </option>
              </select>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="grid gap-3 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Âm thanh tin nhắn" : "Message Sound"}
            </span>

            <div className="flex items-center justify-between max-w-md">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {locale === "vi"
                  ? "Phát âm báo nhẹ khi có tin nhắn mới"
                  : "Play subtle chime for incoming messages"}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "cursor-pointer relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  soundEnabled ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Danger Zone */}
      <div className="border border-rose-200 dark:border-rose-900/40 bg-rose-50/25 dark:bg-rose-950/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-rose-100 dark:border-rose-900/30">
          <h2 className="text-base font-semibold text-rose-900 dark:text-rose-400">
            {locale === "vi" ? "Vùng nguy hiểm" : "Danger Zone"}
          </h2>
          <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-0.5">{t.dangerZoneDesc}</p>
        </div>

        <div className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              {t.deleteAccount}
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {locale === "vi"
                ? "Hành động này không thể hoàn tác. Mọi lịch sử trò chuyện và tệp tin sẽ bị xoá."
                : "This action is permanent and cannot be undone."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="cursor-pointer self-start sm:self-auto inline-flex items-center px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#1c2030] text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700 transition-all shadow-2xs"
          >
            {t.deleteAccount}
          </button>
        </div>
      </div>

      {/* Change Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-[#151824] rounded-2xl border border-border dark:border-white/10 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {t.changeEmail}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEmailModalOpen(false);
                  resetEmailForm();
                }}
                className="cursor-pointer text-zinc-400 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "vi"
                ? "Nhập địa chỉ email mới. Chúng tôi sẽ gửi một mã xác minh gồm 6 chữ số."
                : "Enter your new email address. We will send a 6-digit confirmation code."}
            </p>
            <form onSubmit={handleEmailSubmit(onChangeEmail)} className="space-y-4">
              <input
                type="email"
                required
                placeholder="new.email@example.com"
                {...registerEmail("newEmail", { required: true })}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              />
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    resetEmailForm();
                  }}
                  className="cursor-pointer px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                >
                  {locale === "vi" ? "Huỷ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                >
                  {locale === "vi" ? "Tiếp tục" : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-[#151824] rounded-2xl border border-border dark:border-white/10 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {t.changePassword}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  resetPasswordForm();
                }}
                className="cursor-pointer text-zinc-400 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  {locale === "vi" ? "Mật khẩu hiện tại" : "Current password"}
                </label>
                <input
                  type="password"
                  required
                  {...registerPassword("oldPassword", { required: true })}
                  className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  {locale === "vi" ? "Mật khẩu mới" : "New password"}
                </label>
                <input
                  type="password"
                  required
                  {...registerPassword("newPassword", { required: true })}
                  className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    resetPasswordForm();
                  }}
                  className="cursor-pointer px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                >
                  {locale === "vi" ? "Huỷ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                >
                  {locale === "vi" ? "Cập nhật mật khẩu" : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-[#151824] rounded-2xl border border-border dark:border-white/10 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                {t.deleteAccount}
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {locale === "vi"
                ? "Bạn có chắc chắn muốn xoá tài khoản này vĩnh viễn? Tất cả các cuộc hội thoại, tệp đính kèm và dữ liệu người dùng sẽ bị xoá khỏi máy chủ."
                : "Are you sure you want to permanently delete your account? All messages and attachments will be erased from our servers."}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
              >
                {locale === "vi" ? "Huỷ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  onShowToast(
                    locale === "vi"
                      ? "Yêu cầu xóa tài khoản đã được tiếp nhận."
                      : "Account deletion request received."
                  );
                }}
                className="cursor-pointer px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                {locale === "vi" ? "Xác nhận xoá" : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
