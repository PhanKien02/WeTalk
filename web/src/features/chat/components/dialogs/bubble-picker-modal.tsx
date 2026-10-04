"use client";

import { useState } from "react";
import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  BUBBLE_PRESETS,
  useConversationTheme,
} from "../../context/conversation-theme-context";

export function BubblePickerModal() {
  const { t } = useI18n();
  const {
    theme,
    currentPreset: wallpaperPreset,
    setBubbleStyleId,
    setShowBubbleIcon,
    isBubblePickerOpen,
    setIsBubblePickerOpen,
  } = useConversationTheme();

  const [selectedId, setSelectedId] = useState(theme.bubbleStyleId || "modern-violet");
  const [selectedShowIcon, setSelectedShowIcon] = useState(theme.showBubbleIcon !== false);

  if (!isBubblePickerOpen) return null;

  const handleApply = () => {
    setBubbleStyleId(selectedId);
    setShowBubbleIcon(selectedShowIcon);
    setIsBubblePickerOpen(false);
  };

  const handleReset = () => {
    setSelectedId("modern-violet");
    setSelectedShowIcon(true);
    setBubbleStyleId("modern-violet");
    setShowBubbleIcon(true);
    setIsBubblePickerOpen(false);
  };

  // The preset currently being previewed in the modal
  const activePreset =
    BUBBLE_PRESETS.find((p) => p.id === selectedId) || BUBBLE_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div
        className="w-full max-w-2xl bg-card dark:bg-[#151824] rounded-3xl shadow-2xl border border-border dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t.bubbleStyle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.bubbleStyleDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBubblePickerOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto flex flex-col gap-6">
          {/* Live Interactive Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {t.previewBubble}
              </span>
              <span className="text-[11px] font-medium text-zinc-400">
                {activePreset.nameFallback} • {activePreset.iconEmoji}
              </span>
            </div>

            <div
              className={cn(
                "w-full rounded-2xl border border-border dark:border-white/10 p-4.5 flex flex-col justify-end gap-3 overflow-hidden transition-all duration-300 relative shadow-inner min-h-35",
                wallpaperPreset.className
              )}
              style={wallpaperPreset.style}
            >
              {/* Incoming demo bubble */}
              <div
                className={cn(
                  "self-start max-w-[78%] px-4 py-2.5 text-xs font-medium leading-relaxed transition-all shadow-xs",
                  activePreset.incomingShapeClass,
                  activePreset.incomingBubbleClass
                )}
              >
                Cậu thấy kiểu bong bóng chat này trông như thế nào? ✨
              </div>

              {/* Outgoing demo bubble */}
              <div
                className={cn(
                  "self-end max-w-[78%] px-4 py-2.5 text-xs font-medium leading-relaxed transition-all flex items-start gap-2 shadow-xs",
                  activePreset.shapeClass,
                  activePreset.ownBubbleClass
                )}
              >
                <span className="flex-1">
                  Màu sắc và hình dáng rất đẹp mắt, trông đặc sắc và nổi bật hơn hẳn!
                </span>
                {selectedShowIcon && activePreset.iconEmoji && (
                  <span className="text-xs shrink-0 self-end mt-0.5 filter drop-shadow-2xs">
                    {activePreset.iconEmoji}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Option Toggle: Show decorative icon */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
                <span className="text-sm">{activePreset.iconEmoji || "✨"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {t.showBubbleIcon}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Hiển thị biểu tượng {activePreset.iconEmoji} đặc trưng ở góc tin nhắn gửi đi
                </span>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={selectedShowIcon}
              onClick={() => setSelectedShowIcon(!selectedShowIcon)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                selectedShowIcon ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out",
                  selectedShowIcon ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Curated Presets Grid */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {t.chooseBubbleStyle}
              </span>
              <span className="text-[11px] text-zinc-400">
                6 phong cách chọn sẵn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BUBBLE_PRESETS.map((preset) => {
                const isSelected = selectedId === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedId(preset.id)}
                    className={cn(
                      "group flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer relative gap-2.5",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs"
                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50/70 dark:hover:bg-white/5"
                    )}
                  >
                    {/* Visual Card Swatch */}
                    <div
                      className="w-full h-18 rounded-xl border border-black/5 dark:border-white/10 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-2xs group-hover:scale-[1.01] transition-transform"
                      style={{ background: preset.previewBg }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                          {preset.tag}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-xs">
                          {preset.iconEmoji}
                        </div>
                      </div>

                      {/* Mini preview bubble */}
                      <div className="flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-white drop-shadow-xs">
                          {preset.nameFallback}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center shadow-md animate-in zoom-in-75">
                            <Check className="w-3 h-3 stroke-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-bold leading-tight",
                            isSelected ? "text-primary" : "text-zinc-800 dark:text-zinc-200"
                          )}
                        >
                          {preset.nameFallback}
                        </span>
                        <span className="text-xs">{preset.iconEmoji}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-50/80 dark:bg-[#11131c] border-t border-border dark:border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetBubbleStyle}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBubblePickerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {t.apply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
