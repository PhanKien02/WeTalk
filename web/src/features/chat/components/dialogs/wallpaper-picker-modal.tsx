"use client";

import { useRef, useState } from "react";
import { Check, Image as ImageIcon, RotateCcw, UploadCloud, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  WALLPAPER_PRESETS,
  useConversationTheme,
} from "../../context/conversation-theme-context";

export function WallpaperPickerModal() {
  const { t } = useI18n();
  const {
    theme,
    setWallpaperId,
    setCustomWallpaperUrl,
    resetTheme,
    isWallpaperPickerOpen,
    setIsWallpaperPickerOpen,
  } = useConversationTheme();

  const [selectedId, setSelectedId] = useState(theme.wallpaperId);
  const [selectedCustomUrl, setSelectedCustomUrl] = useState<string | undefined>(
    theme.customWallpaperUrl
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isWallpaperPickerOpen) return null;

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSelectedCustomUrl(result);
        setSelectedId("custom");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (selectedId === "custom" && selectedCustomUrl) {
      setCustomWallpaperUrl(selectedCustomUrl);
    } else {
      setWallpaperId(selectedId);
    }
    setIsWallpaperPickerOpen(false);
  };

  const handleReset = () => {
    resetTheme();
    setSelectedId("default");
    setSelectedCustomUrl(undefined);
    setIsWallpaperPickerOpen(false);
  };

  // Preview styling
  const activePreset =
    selectedId === "custom" && selectedCustomUrl
      ? {
          className: "bg-cover bg-center bg-no-repeat",
          style: { backgroundImage: `url(${selectedCustomUrl})` },
          isDark: false,
        }
      : WALLPAPER_PRESETS.find((p) => p.id === selectedId) || WALLPAPER_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div
        className="w-full max-w-xl bg-card dark:bg-[#151824] rounded-3xl shadow-2xl border border-border dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ImageIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t.chatWallpaper}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.chatWallpaperDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWallpaperPickerOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto flex flex-col gap-6">
          {/* Live Preview Panel */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {t.previewWallpaper}
            </span>
            <div
              className={cn(
                "w-full h-36 rounded-2xl border border-border p-4 flex flex-col justify-end gap-2 overflow-hidden transition-all duration-300 relative shadow-inner",
                activePreset.className
              )}
              style={activePreset.style}
            >
              {/* Incoming demo bubble */}
              <div className="self-start max-w-[70%] px-3.5 py-2 rounded-2xl rounded-tl-xs bg-white/90 backdrop-blur-md shadow-xs text-zinc-800 text-xs font-medium">
                Chào bạn! Đây là bản xem trước hình nền trò chuyện ✨
              </div>
              {/* Outgoing demo bubble */}
              <div className="self-end max-w-[70%] px-3.5 py-2 rounded-2xl rounded-tr-xs bg-primary text-white shadow-xs text-xs font-medium">
                Tuyệt vời, màu nền nhìn rất đẹp và tinh tế! 👍
              </div>
            </div>
          </div>

          {/* Preset Swatches */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {t.chooseWallpaper}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected = selectedId === preset.id;
                const rawName = t[preset.nameKey];
                const localizedName = typeof rawName === "string" ? rawName : preset.nameFallback;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(preset.id);
                    }}
                    className={cn(
                      "group flex flex-col items-center gap-2 p-2.5 rounded-2xl border text-center transition-all cursor-pointer relative",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50/60 dark:hover:bg-white/5"
                    )}
                  >
                    <div
                      className="w-full h-16 rounded-xl border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center transition-transform group-hover:scale-102 relative overflow-hidden"
                      style={{
                        background: preset.previewBg,
                        ...(preset.style || {}),
                      }}
                    >
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md animate-in zoom-in-75">
                          <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold truncate w-full",
                        isSelected ? "text-primary" : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      {localizedName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Upload Option */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border dark:border-white/10">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {t.customWallpaper}
            </span>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex items-center gap-3.5 p-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                selectedId === "custom"
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50/60 dark:hover:bg-white/5"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                <UploadCloud className="w-5 h-5 stroke-2" />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {selectedId === "custom" && selectedCustomUrl
                    ? "Đã chọn ảnh tùy biến (bấm để thay đổi)"
                    : t.uploadWallpaper}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {t.customImageUploadDesc}
                </span>
              </div>
              {selectedId === "custom" && selectedCustomUrl && (
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-50/80 dark:bg-[#11131c] border-t border-border dark:border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetWallpaper}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWallpaperPickerOpen(false)}
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
