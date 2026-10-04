import { cn } from "@/lib/utils";
import type { AppLogoProps } from "@/type";
import Image from "next/image";

export function AppLogo({
  className,
  size = 52,
  showText = false,
  priority = true,
  previewOnHover = false,
}: AppLogoProps) {
  const logoElement = (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex items-center justify-center rounded-2xl overflow-hidden shadow-md border border-black/10 dark:border-white/15 transition-all duration-200 active:scale-95 select-none bg-indigo-600/10 dark:bg-indigo-500/20 shrink-0 group/logo",
        className,
      )}
      title={previewOnHover ? undefined : "WeTalk — Modern Chat App"}
    >
      <Image
        src="/logo.png"
        alt="WeTalk Logo"
        width={size * 2}
        height={size * 2}
        priority={priority}
        quality={100}
        className="w-full h-full object-cover scale-125 transition-transform duration-300 group-hover/logo:scale-135"
      />
    </div>
  );

  const withPreview = previewOnHover ? (
    <div className="relative group/preview">
      {logoElement}

      {/* Thẻ xem trước logo lớn — hiện khi hover / focus */}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full top-0 ml-4 z-50 w-56 p-4 rounded-2xl bg-white dark:bg-[#151824] border border-zinc-200 dark:border-white/10 shadow-xl opacity-0 -translate-x-1 scale-95 origin-left transition-all duration-200 delay-0 group-hover/preview:opacity-100 group-hover/preview:translate-x-0 group-hover/preview:scale-100 group-hover/preview:delay-300 group-focus-within/preview:opacity-100 group-focus-within/preview:translate-x-0 group-focus-within/preview:scale-100"
      >
        <div className="w-full aspect-square rounded-xl overflow-hidden bg-indigo-600/10 dark:bg-indigo-500/20">
          <Image
            src="/logo.png"
            alt=""
            width={448}
            height={448}
            quality={100}
            className="w-full h-full object-cover scale-125"
          />
        </div>
        <p className="mt-3 text-[15px] font-bold text-zinc-900 dark:text-zinc-100">WeTalk</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Modern Chat App</p>
      </div>
    </div>
  ) : (
    logoElement
  );

  if (showText) {
    return (
      <div className="flex items-center gap-3 group select-none">
        {withPreview}
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
          WeTalk
        </span>
      </div>
    );
  }

  return withPreview;
}
