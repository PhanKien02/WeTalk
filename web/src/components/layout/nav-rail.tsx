"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MessageSquare, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";
import { ThemeToggle } from "../theme/theme-toggle";

export function NavRail() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const { logout } = useAuth();

  const isMessagesActive = pathname.startsWith("/messages") || pathname === "/";
  const isProfileActive = pathname.startsWith("/profile");

  const navItems = [
    {
      icon: MessageSquare,
      label: t.messages,
      href: "/messages",
      active: isMessagesActive,
    },
    // { icon: Calendar, label: t.calendar, href: "/messages", active: false },
  ];

  const toggleLanguage = () => {
    setLocale(locale === "vi" ? "en" : "vi");
  };

  return (
    <aside className="w-21 shrink-0 border-r border-border bg-white dark:bg-[#11131f] flex flex-col items-center py-6 justify-between select-none z-20 transition-colors">
      {/* Top Section: App Logo + Main Nav */}
      <div className="flex flex-col items-center gap-9 w-full">
        <Link href="/messages" className="transition-transform hover:scale-105">
          <AppLogo size={70} previewOnHover />
        </Link>

        <nav className="flex flex-col items-center gap-7 w-full">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={idx}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "text-primary"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5",
                )}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />

                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Theme Toggle + Language Switcher + Profile / Settings + Logout */}
      <div className="flex flex-col items-center gap-3.5 w-full">
        {/* Theme Toggle Button */}
        <ThemeToggle align="left" />

        {/* Language switch button */}
        <button
          type="button"
          onClick={toggleLanguage}
          title={t.switchLanguage}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-xl text-zinc-500 hover:text-primary hover:bg-primary-soft/60 dark:hover:bg-primary/20 transition-all font-semibold text-xs border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#151824] cursor-pointer shadow-2xs"
        >
          <span className="uppercase text-[11px] font-bold text-primary">
            {locale === "vi" ? "🇻🇳" : "🇦🇺"}
          </span>
        </button>

        <Link
          href="/profile"
          title={t.profile}
          className={cn(
            "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 cursor-pointer group",
            isProfileActive
              ? "text-primary bg-primary-soft/60 dark:bg-primary/20"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5",
          )}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
          {isProfileActive && (
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
          )}
        </Link>

        {/* Nút Đăng xuất */}
        <button
          type="button"
          onClick={logout}
          title={t.signOut}
          className="flex items-center justify-center w-11 h-11 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer group"
        >
          <LogOut className="w-5 h-5 stroke-[2.2] transition-transform group-hover:scale-110" />
        </button>
      </div>
    </aside>
  );
}
