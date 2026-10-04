"use client";

import { Download, FileCode, FileText, Image as ImageIcon } from "lucide-react";
import { useImageLightbox } from "@/components/ui/image-lightbox";
import type { FileItemProps } from "@/type";

export function FileItem({ file }: FileItemProps) {
  const { openLightbox } = useImageLightbox();
  const canPreview = file.type === "png" && !!file.previewUrl;

  const getFileIcon = () => {
    switch (file.type) {
      case "pdf":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] dark:bg-rose-500/10 flex items-center justify-center text-[#EF4444] dark:text-rose-400 shrink-0 border border-[#FEE2E2] dark:border-rose-500/20">
            <FileText className="w-5 h-5 stroke-2" />
          </div>
        );
      case "png":
        if (canPreview) {
          return (
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#DCFCE7] dark:border-emerald-500/20 bg-[#F0FDF4] dark:bg-emerald-500/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.previewUrl}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              />
            </div>
          );
        }
        return (
          <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] dark:bg-emerald-500/10 flex items-center justify-center text-[#22C55E] dark:text-emerald-400 shrink-0 border border-[#DCFCE7] dark:border-emerald-500/20">
            <ImageIcon className="w-5 h-5 stroke-2" />
          </div>
        );
      case "docx":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/10 flex items-center justify-center text-[#3B82F6] dark:text-blue-400 shrink-0 border border-[#DBEAFE] dark:border-blue-500/20">
            <FileText className="w-5 h-5 stroke-2" />
          </div>
        );
      case "xxl":
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-purple-500/10 flex items-center justify-center text-[#8B5CF6] dark:text-purple-400 shrink-0 border border-[#EDE9FE] dark:border-purple-500/20">
            <FileCode className="w-5 h-5 stroke-2" />
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors select-none group">
      <button
        type="button"
        disabled={!canPreview}
        title={canPreview ? "Xem trước ảnh" : undefined}
        onClick={() => canPreview && openLightbox([{ src: file.previewUrl!, alt: file.name }])}
        className="flex items-center gap-3.5 min-w-0 text-left enabled:cursor-zoom-in disabled:cursor-default"
      >
        {getFileIcon()}
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-semibold text-foreground truncate leading-snug">
            {file.name}
          </span>
          <span className="text-[12px] text-muted-foreground font-medium leading-snug mt-0.5">
            {file.extension} {file.size}
          </span>
        </div>
      </button>

      {/* Download Action Button */}
      <button
        type="button"
        title="Download file"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/70 group-hover:text-primary group-hover:bg-primary-soft dark:group-hover:bg-primary/20 transition-all cursor-pointer shrink-0"
      >
        <Download className="w-4 h-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
