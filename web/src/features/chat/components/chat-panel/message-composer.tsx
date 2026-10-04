"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useConversationTheme } from "../../context/conversation-theme-context";
import { useImageLightbox } from "@/components/ui/image-lightbox";
import type { MessageComposerProps } from "@/type";

const MAX_IMAGES = 10;

interface PendingImage {
  id: string;
  url: string;
  name: string;
}

export function MessageComposer({ onSendMessage }: MessageComposerProps) {
  const { t } = useI18n();
  const { theme, setIsEmojiPickerOpen } = useConversationTheme();
  const { openLightbox } = useImageLightbox();
  const [content, setContent] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ảnh chưa gửi -> thu hồi object URL khi unmount để tránh rò rỉ bộ nhớ
  const pendingRef = useRef(pendingImages);
  useEffect(() => {
    pendingRef.current = pendingImages;
  }, [pendingImages]);
  useEffect(() => {
    return () => pendingRef.current.forEach((img) => URL.revokeObjectURL(img.url));
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setPendingImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const next = images.slice(0, Math.max(room, 0)).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      return [...prev, ...next];
    });
  };

  const removeImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const canSend = !!content.trim() || pendingImages.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    // Object URL được giữ lại vì tin nhắn đã gửi vẫn dùng để hiển thị
    onSendMessage(
      content,
      pendingImages.length ? pendingImages.map((img) => img.url) : undefined,
    );
    setContent("");
    setPendingImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      addFiles(files);
    }
  };

  return (
    <div
      className="px-6 pt-3 pb-6 border-t border-border/80 bg-white/95 dark:bg-[#11131f]/95 backdrop-blur-md flex flex-col gap-3 transition-colors"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
      }}
    >
      {/* Image preview strip */}
      {pendingImages.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pl-14 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          {pendingImages.map((img, i) => (
            <div
              key={img.id}
              className="relative w-18 h-18 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xs group"
            >
              <button
                type="button"
                title={img.name}
                onClick={() =>
                  openLightbox(
                    pendingImages.map((p) => ({ src: p.url, alt: p.name })),
                    i,
                  )
                }
                className="w-full h-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>
              <button
                type="button"
                aria-label={`Xoá ${img.name}`}
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          ))}

          {pendingImages.length < MAX_IMAGES && (
            <button
              type="button"
              title="Thêm ảnh"
              onClick={() => fileInputRef.current?.click()}
              className="w-18 h-18 shrink-0 rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/15 text-zinc-400 hover:text-primary hover:border-primary/60 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Icon Attach File */}
        <button
          type="button"
          title="Đính kèm ảnh"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
        >
          <Paperclip className="w-5 h-5 -rotate-45 stroke-2" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Input container */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={t.typeMessage}
            className="w-full h-12 pl-5 pr-22 rounded-2xl bg-white dark:bg-[#151824] border border-[#E2E8F0] dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-2xs"
          />

          {/* Right side controls: Emoji trigger + (Default Emoji Send OR Submit Send) */}
          <div className="absolute right-2.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              title={t.chooseEmoji}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Smile className="w-5 h-5 stroke-2" />
            </button>

            {canSend ? (
              <button
                type="button"
                onClick={handleSend}
                title={t.send}
                className="p-1.5 rounded-lg text-primary hover:bg-primary-soft active:scale-95 transition-all cursor-pointer"
              >
                <SendHorizontal className="w-5 h-5 stroke-[2.2]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSendMessage(theme.defaultEmoji)}
                title={`${t.defaultEmoji}: ${theme.defaultEmoji}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xl hover:scale-125 active:scale-90 transition-transform cursor-pointer select-none"
              >
                {theme.defaultEmoji}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
