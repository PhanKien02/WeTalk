"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ConversationTagProps } from "@/type";

export function ConversationTag({ tag, className }: ConversationTagProps) {
  const { t } = useI18n();

  // Tra cứu theo từ điển nếu có
  const label =
    tag.labelKey && tag.labelKey in t.tags
      ? t.tags[tag.labelKey as keyof typeof t.tags]
      : tag.fallbackLabel;

  const toneStyles = {
    orange: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-500/20",
    green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-500/20",
    outline: "bg-zinc-50/50 dark:bg-transparent text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] leading-tight select-none transition-colors",
        toneStyles[tag.tone],
        className
      )}
    >
      {label}
    </span>
  );
}
