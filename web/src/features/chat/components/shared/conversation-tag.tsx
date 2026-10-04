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
    orange: "bg-[#FEF5EC] text-[#F2994A] font-medium border border-transparent",
    green: "bg-[#EAF9F0] text-[#3DBB6A] font-medium border border-transparent",
    outline: "bg-transparent text-[#71717A] border border-[#E4E4E7]",
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
