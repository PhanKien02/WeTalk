"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface LightboxContextValue {
  openLightbox: (images: (LightboxImage | string)[], startIndex?: number) => void;
  closeLightbox: () => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const isOpen = images.length > 0;

  const openLightbox = useCallback(
    (list: (LightboxImage | string)[], startIndex = 0) => {
      const normalized = list
        .map((item) => (typeof item === "string" ? { src: item } : item))
        .filter((item) => !!item.src);
      if (!normalized.length) return;
      setImages(normalized);
      setIndex(Math.min(Math.max(startIndex, 0), normalized.length - 1));
      setZoomed(false);
    },
    [],
  );

  const closeLightbox = useCallback(() => {
    setImages([]);
    setZoomed(false);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      setIndex((prev) => (prev + delta + images.length) % images.length);
      setZoomed(false);
    },
    [images.length],
  );

  // Phím tắt + khoá cuộn trang khi mở
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeLightbox, go]);

  const value = useMemo(
    () => ({ openLightbox, closeLightbox }),
    [openLightbox, closeLightbox],
  );

  const current = images[index];

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {isOpen &&
        current &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={current.alt || "Xem ảnh"}
            className="fixed inset-0 z-100 flex flex-col bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-200 select-none"
            onClick={closeLightbox}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5 py-4 text-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate max-w-[60vw]">
                  {current.alt || "Hình ảnh"}
                </span>
                {images.length > 1 && (
                  <span className="text-xs text-white/50 tabular-nums">
                    {index + 1} / {images.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <LightboxButton
                  label={zoomed ? "Thu nhỏ" : "Phóng to"}
                  onClick={() => setZoomed((z) => !z)}
                >
                  {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                </LightboxButton>
                <a
                  href={current.src}
                  download
                  target="_blank"
                  rel="noreferrer"
                  title="Tải xuống"
                  aria-label="Tải xuống"
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
                <LightboxButton label="Đóng (Esc)" onClick={closeLightbox}>
                  <X className="w-5 h-5" />
                </LightboxButton>
              </div>
            </div>

            {/* Image stage */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-20 overflow-auto">
              {images.length > 1 && (
                <button
                  type="button"
                  aria-label="Ảnh trước"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element -- hỗ trợ blob: URL & ảnh ngoài */}
              <img
                key={current.src}
                src={current.src}
                alt={current.alt || ""}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed((z) => !z);
                }}
                className={cn(
                  "rounded-xl shadow-2xl object-contain transition-transform duration-300 animate-in zoom-in-95 fade-in-0",
                  zoomed
                    ? "max-w-none max-h-none scale-150 cursor-zoom-out"
                    : "max-w-full max-h-[calc(100vh-180px)] cursor-zoom-in",
                )}
              />

              {images.length > 1 && (
                <button
                  type="button"
                  aria-label="Ảnh tiếp theo"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div
                className="flex items-center justify-center gap-2 px-4 py-4 overflow-x-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, i) => (
                  <button
                    key={`${img.src}-${i}`}
                    type="button"
                    aria-label={`Ảnh ${i + 1}`}
                    onClick={() => {
                      setIndex(i);
                      setZoomed(false);
                    }}
                    className={cn(
                      "w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-2 transition-all cursor-pointer",
                      i === index
                        ? "ring-white opacity-100"
                        : "ring-transparent opacity-50 hover:opacity-90",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </LightboxContext.Provider>
  );
}

function LightboxButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

export function useImageLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) {
    return { openLightbox: () => {}, closeLightbox: () => {} } as LightboxContextValue;
  }
  return ctx;
}
