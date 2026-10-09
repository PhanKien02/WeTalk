"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { Calendar, Camera, Check, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { mockUsers } from "@/features/chat/data/mock-data";
import { userService } from "@/services/user.service";
import { getAuthErrorMessage } from "@/services/auth.service";
import { cn } from "@/lib/utils";
import type { ProfileFormValues, ProfileTabProps } from "@/type";

export function ProfileTab({
  onShowToast,
  avatarSrc,
  setAvatarSrc,
  setPrevAvatarSrc,
}: ProfileTabProps) {
  const { locale, t } = useI18n();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form initial state matching User model
  const initialData = {
    name: user?.name || mockUsers.me.name || "Tuấn Khang",
    email: user?.email || mockUsers.me.email || "khang.tuan@wetalk.io",
    phone: user?.phone || mockUsers.me.phone || "+84 987 654 321",
    location: user?.location || mockUsers.me.location || "Hà Nội, Việt Nam",
    bio:
      user?.bio ||
      mockUsers.me.bio ||
      "Building intuitive interfaces and seamless real-time messaging experiences.",
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  // React Hook Form for Profile Info
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    values: {
      name: user?.name || initialData.name,
      email: user?.email || initialData.email,
      phone: user?.phone || initialData.phone,
      location: user?.location || initialData.location,
      bio: user?.bio || initialData.bio,
    },
  });

  const watchedName = useWatch({ control, name: "name" });
  const currentDisplayName = watchedName || initialData.name;

  // Avatar states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Formatted CreatedAt for display
  const rawCreatedAt = user?.created_at || user?.createdAt;
  const formattedCreatedAt = (() => {
    if (!rawCreatedAt) {
      return locale === "vi" ? "12 tháng 06, 2026" : "June 12, 2026";
    }
    try {
      const d = new Date(rawCreatedAt);
      if (isNaN(d.getTime())) return String(rawCreatedAt);
      return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(rawCreatedAt);
    }
  })();

  // Handle avatar upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(
        locale === "vi"
          ? "Ảnh nặng hơn 2 MB. Vui lòng chọn ảnh nhỏ hơn."
          : "Image exceeds 2 MB. Please select a smaller file.",
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
            : "Profile photo updated successfully.",
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
      true,
    );
  };

  // Handle Save Profile
  const onSaveProfile = async (data: ProfileFormValues) => {
    try {
      if (user?.id) {
        await userService.updateUser(user.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          location: data.location,
          bio: data.bio,
          avatar: avatarSrc || undefined,
        });
      }
      if (updateUser) {
        updateUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          location: data.location,
          bio: data.bio,
          avatar: avatarSrc || undefined,
        });
      }
      reset(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onShowToast(
        locale === "vi"
          ? "Đã lưu thay đổi thông tin cá nhân thành công."
          : "Profile details updated successfully.",
      );
    } catch (err: unknown) {
      console.error("Failed to update user profile:", err);
      const errMsg = getAuthErrorMessage(err);
      onShowToast(
        errMsg ||
          (locale === "vi"
            ? "Cập nhật hồ sơ thất bại. Vui lòng thử lại."
            : "Failed to update profile. Please try again."),
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* User Profile Form Card */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {t.personalInfo}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.personalInfoSub}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSaveProfile)}
          className="divide-y divide-border/70 dark:divide-white/10"
        >
          {/* 1. Avatar */}
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Ảnh đại diện" : "Avatar"}
            </span>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar preview */}
              <div className="relative group shrink-0">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl overflow-hidden bg-primary-soft dark:bg-primary/20 flex items-center justify-center font-bold text-xl text-primary border border-border/60 dark:border-white/10 transition-opacity",
                    isUploadingAvatar && "opacity-50",
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
                  <p className="text-xs text-muted-foreground">
                    {t.avatarHint}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Name */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.fullName}
            </label>
            <div className="max-w-md">
              <input
                id="name"
                type="text"
                {...register("name", { required: true })}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                required
              />
            </div>
          </div>

          {/* 3. Email */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              Email ({t.canNotUpdate})
            </label>
            <div className="max-w-md">
              <input
                id="email"
                disabled
                type="email"
                {...register("email", { required: true })}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                required
              />
            </div>
          </div>

          {/* 4. Phone */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {t.phoneNumber} ({t.canNotUpdate})
            </label>
            <div className="max-w-md">
              <input
                id="phone"
                type="tel"
                disabled
                {...register("phone")}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* 5. Location */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
            <label
              htmlFor="location"
              className="text-sm font-medium text-foreground pt-2.5"
            >
              {locale === "vi" ? "Địa chỉ / Khu vực" : "Location"}
            </label>
            <div className="max-w-md">
              <input
                id="location"
                type="text"
                placeholder={
                  locale === "vi"
                    ? "Ví dụ: Hà Nội, Việt Nam"
                    : "e.g. Hanoi, Vietnam"
                }
                {...register("location")}
                className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* 6. Bio */}
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
                placeholder={
                  locale === "vi"
                    ? "Giới thiệu ngắn về bản thân..."
                    : "Tell others a little about yourself..."
                }
                {...register("bio")}
                className="w-full p-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all resize-none leading-relaxed placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* 7. CreatedAt (Read-only) */}
          <div className="grid gap-2 px-6 py-4.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <span className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Ngày tham gia" : "Member Since"}
            </span>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-foreground font-medium text-xs">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{formattedCreatedAt}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({locale === "vi" ? "Tự động" : "Created At"})
              </span>
            </div>
          </div>

          {/* Form Actions Footer */}
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
    </div>
  );
}
