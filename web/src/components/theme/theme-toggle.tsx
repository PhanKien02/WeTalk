"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "dropdown" | "pills";
  align?: "left" | "right";
}

export function ThemeToggle({
  className,
  variant = "dropdown",
  align = "right",
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-10 h-10 rounded-xl bg-zinc-100/60 dark:bg-white/5 animate-pulse",
          className
        )}
      />
    );
  }

  const options = [
    {
      id: "light",
      label: t.themeLight || "Sáng",
      icon: Sun,
      desc: "Giao diện sáng",
    },
    {
      id: "dark",
      label: t.themeDark || "Tối",
      icon: Moon,
      desc: "Giao diện tối",
    },
    {
      id: "system",
      label: t.themeSystem || "Hệ thống",
      icon: Monitor,
      desc: "Theo hệ điều hành",
    },
  ];

  // If rendered as pills (e.g. in settings page)
  if (variant === "pills") {
    return (
      <div className={cn("flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-border", className)}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                isSelected
                  ? "bg-white dark:bg-[#1a1d2e] text-primary shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Icon className="w-4 h-4 stroke-[2.2]" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Current display icon
  const CurrentIcon =
    theme === "system"
      ? Monitor
      : resolvedTheme === "dark"
      ? Moon
      : Sun;

  return (
    <div className={cn("relative inline-block", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`${t.theme || "Giao diện"}: ${
          theme === "system"
            ? t.themeSystem || "Hệ thống"
            : theme === "dark"
            ? t.themeDark || "Tối"
            : t.themeLight || "Sáng"
        }`}
        aria-label="Toggle theme"
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none",
          "border border-zinc-200/80 dark:border-white/10",
          "bg-white/90 dark:bg-[#151824] hover:bg-zinc-100 dark:hover:bg-white/10",
          "text-zinc-700 dark:text-zinc-200 hover:text-primary dark:hover:text-primary",
          "active:scale-95 shadow-2xs"
        )}
      >
        <CurrentIcon className="w-4.5 h-4.5 stroke-[2.2] transition-transform hover:rotate-12 duration-200" />
      </button>

      {/* Dropdown Menu (3 choices visible at once as per M31) */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 w-48 rounded-2xl bg-white dark:bg-[#171a26] border border-border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-border/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t.theme || "Giao diện"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary-soft text-primary dark:bg-primary/20"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-zinc-400 font-normal leading-tight">
                        {opt.desc}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary stroke-[2.8]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
