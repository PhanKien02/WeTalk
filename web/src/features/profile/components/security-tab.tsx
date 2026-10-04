"use client";

import React, { useState } from "react";
import { Laptop, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SecurityTabProps } from "@/type";

export function SecurityTab({ onShowToast }: SecurityTabProps) {
  const { locale, t } = useI18n();

  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Chrome on macOS",
      isCurrent: true,
      location: "Hà Nội, Việt Nam",
      ip: "118.70.190.12",
      lastActive: locale === "vi" ? "Đang hoạt động" : "Active now",
      icon: Laptop,
    },
    {
      id: "sess-2",
      device: "Safari on iPhone 15 Pro",
      isCurrent: false,
      location: "Hà Nội, Việt Nam",
      ip: "14.162.145.88",
      lastActive: locale === "vi" ? "2 giờ trước" : "2 hours ago",
      icon: Smartphone,
    },
  ]);

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    onShowToast(
      locale === "vi"
        ? "Đã đăng xuất khỏi thiết bị đã chọn."
        : "Signed out of selected device."
    );
  };

  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    onShowToast(
      locale === "vi"
        ? "Đã đăng xuất khỏi tất cả các thiết bị khác."
        : "Signed out of all other devices."
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 2FA Card */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10">
          <h2 className="text-base font-semibold text-foreground">
            {locale === "vi"
              ? "Xác thực hai lớp (2FA)"
              : "Two-Factor Authentication (2FA)"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "vi"
              ? "Bảo vệ tài khoản của bạn bằng bước bảo mật bổ sung qua Authenticator."
              : "Add an extra layer of security using an authenticator app."}
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">
                {locale === "vi"
                  ? "Đã bật từ 12/06/2026"
                  : "Enabled since 12/06/2026"}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Google Authenticator (TOTP)
              </p>
            </div>
          </div>

          <button
            type="button"
            className="cursor-pointer self-start sm:self-auto inline-flex items-center px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all shadow-2xs"
          >
            {locale === "vi" ? "Tùy chọn 2FA" : "Manage 2FA"}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-card dark:bg-[#151824] border border-border dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t.activeSessions}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "vi"
                ? "Các thiết bị hiện đang đăng nhập vào tài khoản của bạn."
                : "Devices currently signed into your account."}
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              className="cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              {t.logoutAll}
            </button>
          )}
        </div>

        <div className="divide-y divide-border/70 dark:divide-white/10">
          {sessions.map((sess) => {
            const DeviceIcon = sess.icon;
            return (
              <div
                key={sess.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                    <DeviceIcon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {sess.device}
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {locale === "vi" ? "Thiết bị này" : "Current"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sess.location} · {sess.lastActive}
                    </p>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(sess.id)}
                    className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    {locale === "vi" ? "Đăng xuất" : "Revoke"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
