"use client";

import { memo } from "react";
import { Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ConversationSearchProps } from "@/type";

export const ConversationSearch = memo(function ConversationSearch({
  value,
  onChange,
}: ConversationSearchProps) {
  const { t } = useI18n();

  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 stroke-[2.2] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchPlaceholder}
        className="w-full h-11 pl-10 pr-9 bg-[#F4F4F6] dark:bg-white/5 text-zinc-800 dark:text-zinc-100 text-sm rounded-xl outline-none placeholder:text-zinc-400 focus:bg-white dark:focus:bg-[#1a1d2e] focus:ring-2 focus:ring-primary/20 transition-all border border-transparent dark:border-white/10 focus:border-primary/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      )}
    </div>
  );
});

