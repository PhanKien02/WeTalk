"use client";

import { useState } from "react";
import { Check, Smile, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  EMOJI_OPTIONS,
  useConversationTheme,
} from "../../context/conversation-theme-context";

export function DefaultEmojiModal() {
  const { t } = useI18n();
  const {
    theme,
    setDefaultEmoji,
    isEmojiPickerOpen,
    setIsEmojiPickerOpen,
  } = useConversationTheme();

  const [selectedEmoji, setSelectedEmoji] = useState(theme.defaultEmoji);

  if (!isEmojiPickerOpen) return null;

  const handleSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setDefaultEmoji(emoji);
    // Smooth auto close after quick feedback
    setTimeout(() => {
      setIsEmojiPickerOpen(false);
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div
        className="w-full max-w-md bg-card dark:bg-[#151824] rounded-3xl shadow-2xl border border-border dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Smile className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t.defaultEmoji}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.defaultEmojiDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Active Preview Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-border dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1c2030] border border-border/80 dark:border-white/10 shadow-xs flex items-center justify-center text-2xl select-none animate-in zoom-in-50">
                {selectedEmoji}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Biểu tượng hiện tại
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Gửi nhanh 1 chạm ở thanh soạn tin
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phản hồi nhanh</span>
            </div>
          </div>

          {/* Emoji Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {t.chooseEmoji}
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {EMOJI_OPTIONS.map((item) => {
                const isSelected = selectedEmoji === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => handleSelect(item.emoji)}
                    className={cn(
                      "group flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all cursor-pointer relative",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs scale-102"
                        : "border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
                    )}
                  >
                    <span className="text-2xl select-none transition-transform group-hover:scale-115">
                      {item.emoji}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium mt-1 truncate max-w-full",
                        isSelected ? "text-primary font-bold" : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-zinc-50/80 dark:bg-[#11131c] border-t border-border dark:border-white/10">
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
