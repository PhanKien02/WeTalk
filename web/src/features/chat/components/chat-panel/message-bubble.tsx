"use client";

import { useConversationTheme } from "../../context/conversation-theme-context";
import { useImageLightbox } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";
import type { MessageBubbleProps } from "@/type";

const MAX_VISIBLE_IMAGES = 4;

function MessageImages({ images, isOwn }: { images: string[]; isOwn: boolean }) {
  const { openLightbox } = useImageLightbox();
  const visible = images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenCount = images.length - visible.length;
  const single = images.length === 1;

  return (
    <div
      className={cn(
        "grid gap-1 overflow-hidden rounded-2xl",
        single ? "grid-cols-1 w-64" : "grid-cols-2 w-64",
        isOwn ? "self-end" : "self-start",
      )}
    >
      {visible.map((src, i) => {
        const isLastWithMore = hiddenCount > 0 && i === visible.length - 1;
        const spanFull = images.length === 3 && i === 0;
        return (
          <button
            key={`${src}-${i}`}
            type="button"
            aria-label={`Xem ảnh ${i + 1}`}
            onClick={() => openLightbox(images, i)}
            className={cn(
              "relative overflow-hidden bg-zinc-100 dark:bg-white/5 cursor-zoom-in group/img",
              single ? "max-h-80" : "aspect-square",
              spanFull && "col-span-2 aspect-video",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- hỗ trợ blob: URL */}
            <img
              src={src}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
            />
            {isLastWithMore && (
              <span className="absolute inset-0 bg-black/55 text-white text-xl font-bold flex items-center justify-center">
                +{hiddenCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { isOwn, content, images } = message;
  const { currentBubblePreset, theme } = useConversationTheme();

  const hasImages = !!images?.length;
  const trimmed = content.trim();

  // Tin nhắn có ảnh: hiển thị lưới ảnh, kèm bong bóng chữ nếu có nội dung
  if (hasImages) {
    return (
      <div className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
        <MessageImages images={images!} isOwn={isOwn} />
        {trimmed && <MessageBubble message={{ ...message, images: undefined }} />}
      </div>
    );
  }
  const isEmojiOnly =
    /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u.test(trimmed) ||
    /^(👍|❤️|🔥|🎉|🚀|👏|💯|😂|😍|✨|☕|🤝|🙌|💡|💪|⚡)$/.test(trimmed);

  if (isEmojiOnly) {
    return (
      <div
        className={cn(
          "group relative select-none py-1 transition-transform hover:scale-115 active:scale-95 duration-150",
          isOwn ? "self-end" : "self-start"
        )}
      >
        <span className="text-4xl leading-none inline-block filter drop-shadow-xs">
          {trimmed}
        </span>
      </div>
    );
  }

  const showIcon = theme.showBubbleIcon !== false && !!currentBubblePreset.iconEmoji;

  return (
    <div
      className={cn(
        "group relative max-w-105 px-4 py-2.5 text-[14px] leading-relaxed transition-all",
        isOwn
          ? cn(currentBubblePreset.shapeClass, currentBubblePreset.ownBubbleClass)
          : cn(currentBubblePreset.incomingShapeClass, currentBubblePreset.incomingBubbleClass)
      )}
    >
      <div className="flex items-start gap-2">
        <p className="whitespace-pre-wrap wrap-break-word flex-1">{content}</p>
        {showIcon && isOwn && (
          <span
            className="text-[12px] opacity-75 shrink-0 select-none self-end mt-0.5 filter drop-shadow-2xs transition-transform group-hover:scale-110"
            title={currentBubblePreset.nameFallback}
          >
            {currentBubblePreset.iconEmoji}
          </span>
        )}
      </div>
    </div>
  );
}

