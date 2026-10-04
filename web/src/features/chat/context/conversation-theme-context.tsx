"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type {
  BubblePreset,
  ConversationThemeContextType,
  ConversationThemeProviderProps,
  ConversationThemeState,
  EmojiOption,
  Translations,
  WallpaperPreset,
} from "@/type";

export type {
  BubblePreset,
  ConversationThemeContextType,
  ConversationThemeProviderProps,
  ConversationThemeState,
  EmojiOption,
  WallpaperPreset,
};

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "default",
    nameKey: "wallpaperDefault",
    nameFallback: "Mặc định sáng",
    className: "bg-[#FAFAFB] dark:bg-[#0b0d14]",
    previewBg: "#FAFAFB",
    isDark: false,
  },
  {
    id: "soft-purple",
    nameKey: "wallpaperSoftPurple",
    nameFallback: "Tím Lavender",
    className: "bg-linear-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#FAF5FF] dark:from-[#1e1b4b]/40 dark:via-[#151824] dark:to-[#0f111a]",
    previewBg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #FAF5FF 100%)",
    isDark: false,
  },
  {
    id: "ocean-breeze",
    nameKey: "wallpaperOceanBreeze",
    nameFallback: "Biển xanh ngọc",
    className: "bg-linear-to-br from-[#ECFEFF] via-[#E0F2FE] to-[#EFF6FF] dark:from-[#082f49]/40 dark:via-[#151824] dark:to-[#0f111a]",
    previewBg: "linear-gradient(135deg, #ECFEFF 0%, #E0F2FE 50%, #EFF6FF 100%)",
    isDark: false,
  },
  {
    id: "sunset-glow",
    nameKey: "wallpaperSunsetGlow",
    nameFallback: "Hoàng hôn đào",
    className: "bg-linear-to-br from-[#FFF1F2] via-[#FFF7ED] to-[#FEF3C7] dark:from-[#450a0a]/30 dark:via-[#151824] dark:to-[#0f111a]",
    previewBg: "linear-gradient(135deg, #FFF1F2 0%, #FFF7ED 50%, #FEF3C7 100%)",
    isDark: false,
  },
  {
    id: "mint-fresh",
    nameKey: "wallpaperMintFresh",
    nameFallback: "Bạc hà tươi mát",
    className: "bg-linear-to-br from-[#ECFDF5] via-[#F0FDF4] to-[#F7FEE7] dark:from-[#064e3b]/30 dark:via-[#151824] dark:to-[#0f111a]",
    previewBg: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #F7FEE7 100%)",
    isDark: false,
  },
  {
    id: "subtle-dots",
    nameKey: "wallpaperSubtleDots",
    nameFallback: "Hạt chấm tối giản",
    className: "bg-slate-50 dark:bg-[#0b0d14]",
    style: {
      backgroundImage: "radial-gradient(#CBD5E1 1.2px, transparent 1.2px)",
      backgroundSize: "20px 20px",
    },
    previewBg: "radial-gradient(#94A3B8 1.5px, #F8FAFC 1.5px)",
    isDark: false,
  },
  {
    id: "aurora",
    nameKey: "wallpaperAurora",
    nameFallback: "Cực quang sắc màu",
    className: "bg-linear-to-tr from-[#EEF2FF] via-[#FCE7F3] to-[#E0E7FF] dark:from-[#1e1b4b]/40 dark:via-[#3b0764]/30 dark:to-[#0f111a]",
    previewBg: "linear-gradient(45deg, #EEF2FF 0%, #FCE7F3 50%, #E0E7FF 100%)",
    isDark: false,
  },
  {
    id: "night-mesh",
    nameKey: "wallpaperNightMesh",
    nameFallback: "Bầu trời đêm",
    className: "bg-[#0F111A] text-zinc-100",
    style: {
      backgroundImage:
        "radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.22) 0px, transparent 55%), radial-gradient(at 0% 100%, rgba(14, 165, 233, 0.2) 0px, transparent 55%)",
    },
    previewBg: "linear-gradient(135deg, #1E1B4B 0%, #0F111A 100%)",
    isDark: true,
  },
];

export const BUBBLE_PRESETS: BubblePreset[] = [
  {
    id: "modern-violet",
    nameFallback: "Tím Wetalk",
    tag: "Mặc định • Bo vát",
    description: "Giao diện thanh lịch, sắc tím chuẩn thương hiệu Wetalk.",
    ownBubbleClass: "bg-primary text-white font-normal shadow-[0_2px_8px_rgba(97,94,240,0.22)]",
    incomingBubbleClass: "bg-white/95 dark:bg-[#1a1d2e] text-zinc-900 dark:text-zinc-100 font-normal shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/10",
    shapeClass: "rounded-2xl rounded-tr-xs",
    incomingShapeClass: "rounded-2xl rounded-tl-xs",
    iconEmoji: "✨",
    iconName: "Sparkles",
    previewBg: "linear-gradient(135deg, #615EF0 0%, #4F46E5 100%)",
  },
  {
    id: "sunset-glow",
    nameFallback: "Hoàng hôn ấm áp",
    tag: "Cam hồng • Bo tròn mượt",
    description: "Dải gradient hoàng hôn cam hồng rực rỡ, năng động và ấm áp.",
    ownBubbleClass: "bg-linear-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-normal shadow-[0_3px_12px_rgba(244,63,94,0.3)]",
    incomingBubbleClass: "bg-rose-50/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-normal border border-rose-200/70 dark:border-rose-800/40 shadow-[0_1px_4px_rgba(244,63,94,0.08)]",
    shapeClass: "rounded-3xl rounded-tr-sm",
    incomingShapeClass: "rounded-3xl rounded-tl-sm",
    iconEmoji: "🔥",
    iconName: "Flame",
    previewBg: "linear-gradient(135deg, #F59E0B 0%, #F43F5E 50%, #EC4899 100%)",
  },
  {
    id: "ocean-breeze",
    nameFallback: "Biển xanh Azure",
    tag: "Xanh ngọc • Dịu mát",
    description: "Gradient đại dương xanh ngọc lam mang lại cảm giác thư thái và tươi mát.",
    ownBubbleClass: "bg-linear-to-r from-cyan-500 to-blue-600 text-white font-normal shadow-[0_3px_12px_rgba(6,182,212,0.3)]",
    incomingBubbleClass: "bg-cyan-50/90 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-100 font-normal border border-cyan-200/70 dark:border-cyan-800/40 shadow-[0_1px_4px_rgba(6,182,212,0.08)]",
    shapeClass: "rounded-2xl rounded-tr-xs",
    incomingShapeClass: "rounded-2xl rounded-tl-xs",
    iconEmoji: "💧",
    iconName: "Droplet",
    previewBg: "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)",
  },
  {
    id: "cyber-neon",
    nameFallback: "Cyber Midnight",
    tag: "Nền tối • Viền Neon phát sáng",
    description: "Nền tối huyền bí viền tím neon phát sáng hiện đại theo phong cách công nghệ.",
    ownBubbleClass: "bg-zinc-900 text-violet-100 font-normal border border-violet-500/50 shadow-[0_0_14px_rgba(139,92,246,0.35)] ring-1 ring-violet-400/20",
    incomingBubbleClass: "bg-zinc-800 text-zinc-100 font-normal border border-zinc-700 shadow-sm",
    shapeClass: "rounded-xl rounded-tr-xs",
    incomingShapeClass: "rounded-xl rounded-tl-xs",
    iconEmoji: "⚡",
    iconName: "Zap",
    previewBg: "linear-gradient(135deg, #18181B 0%, #4C1D95 100%)",
  },
  {
    id: "emerald-luxury",
    nameFallback: "Ngọc lục bảo",
    tag: "Xanh lục • Thanh lịch",
    description: "Sắc xanh ngọc lục bảo tinh tế, đem lại vẻ chuyên nghiệp và tin cậy.",
    ownBubbleClass: "bg-emerald-600 text-white font-normal shadow-[0_2px_8px_rgba(5,150,105,0.25)]",
    incomingBubbleClass: "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-normal border border-emerald-200/70 dark:border-emerald-800/40 shadow-[0_1px_3px_rgba(5,150,105,0.06)]",
    shapeClass: "rounded-2xl rounded-tr-xs",
    incomingShapeClass: "rounded-2xl rounded-tl-xs",
    iconEmoji: "🌿",
    iconName: "Leaf",
    previewBg: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  },
  {
    id: "candy-pop",
    nameFallback: "Kẹo ngọt Pastel",
    tag: "Viên thuốc • Mềm mại",
    description: "Bo tròn hình viên kẹo đáng yêu với sắc hồng tím fuchsia ngọt ngào.",
    ownBubbleClass: "bg-linear-to-r from-fuchsia-500 to-indigo-500 text-white font-normal shadow-[0_3px_12px_rgba(217,70,239,0.3)]",
    incomingBubbleClass: "bg-fuchsia-50/90 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 font-normal border border-purple-200/70 dark:border-purple-800/40 shadow-2xs",
    shapeClass: "rounded-full px-5 py-2.5",
    incomingShapeClass: "rounded-full px-5 py-2.5",
    iconEmoji: "💖",
    iconName: "Heart",
    previewBg: "linear-gradient(135deg, #D946EF 0%, #6366F1 100%)",
  },
];

export const EMOJI_OPTIONS: EmojiOption[] = [
  { emoji: "👍", name: "Thích" },
  { emoji: "❤️", name: "Thả tim" },
  { emoji: "🔥", name: "Tuyệt đỉnh" },
  { emoji: "🎉", name: "Ăn mừng" },
  { emoji: "🚀", name: "Tên lửa" },
  { emoji: "👏", name: "Vỗ tay" },
  { emoji: "💯", name: "100 điểm" },
  { emoji: "😂", name: "Cười lớn" },
  { emoji: "😍", name: "Mê mẩn" },
  { emoji: "✨", name: "Lấp lánh" },
  { emoji: "☕", name: "Cà phê" },
  { emoji: "🤝", name: "Hợp tác" },
  { emoji: "🙌", name: "Hoan hô" },
  { emoji: "💡", name: "Ý tưởng" },
  { emoji: "💪", name: "Cố lên" },
  { emoji: "⚡", name: "Sấm sét" },
];

const ConversationThemeContext = createContext<ConversationThemeContextType | null>(null);

const DEFAULT_THEME: ConversationThemeState = {
  wallpaperId: "default",
  defaultEmoji: "👍",
  bubbleStyleId: "modern-violet",
  showBubbleIcon: true,
};

export function ConversationThemeProvider({
  conversationId,
  children,
}: ConversationThemeProviderProps) {
  const [theme, setTheme] = useState<ConversationThemeState>(DEFAULT_THEME);
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isBubblePickerOpen, setIsBubblePickerOpen] = useState(false);

  // Load from localStorage per conversationId
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`wetalk_theme_${conversationId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme({
          wallpaperId: parsed.wallpaperId || "default",
          customWallpaperUrl: parsed.customWallpaperUrl || undefined,
          defaultEmoji: parsed.defaultEmoji || "👍",
          bubbleStyleId: parsed.bubbleStyleId || "modern-violet",
          showBubbleIcon: parsed.showBubbleIcon ?? true,
        });
      } else {
        setTheme(DEFAULT_THEME);
      }
    } catch {
      setTheme(DEFAULT_THEME);
    }
  }, [conversationId]);

  // Save changes to localStorage
  const updateTheme = (updater: (prev: ConversationThemeState) => ConversationThemeState) => {
    setTheme((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(`wetalk_theme_${conversationId}`, JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save theme to localStorage", err);
      }
      return next;
    });
  };

  const setWallpaperId = (id: string) => {
    updateTheme((prev) => ({
      ...prev,
      wallpaperId: id,
      customWallpaperUrl: undefined, // Clear custom when picking preset
    }));
  };

  const setCustomWallpaperUrl = (url: string | undefined) => {
    updateTheme((prev) => ({
      ...prev,
      wallpaperId: "custom",
      customWallpaperUrl: url,
    }));
  };

  const setDefaultEmoji = (emoji: string) => {
    updateTheme((prev) => ({
      ...prev,
      defaultEmoji: emoji,
    }));
  };

  const setBubbleStyleId = (id: string) => {
    updateTheme((prev) => ({
      ...prev,
      bubbleStyleId: id,
    }));
  };

  const setShowBubbleIcon = (show: boolean) => {
    updateTheme((prev) => ({
      ...prev,
      showBubbleIcon: show,
    }));
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
    try {
      localStorage.removeItem(`wetalk_theme_${conversationId}`);
    } catch {}
  };

  const currentPreset = useMemo(() => {
    if (theme.wallpaperId === "custom" && theme.customWallpaperUrl) {
      return {
        id: "custom",
        nameKey: "customWallpaper" as keyof Translations,
        nameFallback: "Hình nền tùy chỉnh",
        className: "bg-cover bg-center bg-no-repeat",
        style: {
          backgroundImage: `url(${theme.customWallpaperUrl})`,
        },
        previewBg: `url(${theme.customWallpaperUrl})`,
        isDark: false,
      };
    }
    const found = WALLPAPER_PRESETS.find((p) => p.id === theme.wallpaperId);
    return found || WALLPAPER_PRESETS[0];
  }, [theme.wallpaperId, theme.customWallpaperUrl]);

  const currentBubblePreset = useMemo(() => {
    const found = BUBBLE_PRESETS.find((p) => p.id === theme.bubbleStyleId);
    return found || BUBBLE_PRESETS[0];
  }, [theme.bubbleStyleId]);

  return (
    <ConversationThemeContext.Provider
      value={{
        theme,
        currentPreset,
        currentBubblePreset,
        setWallpaperId,
        setCustomWallpaperUrl,
        setDefaultEmoji,
        setBubbleStyleId,
        setShowBubbleIcon,
        resetTheme,
        isWallpaperPickerOpen,
        setIsWallpaperPickerOpen,
        isEmojiPickerOpen,
        setIsEmojiPickerOpen,
        isBubblePickerOpen,
        setIsBubblePickerOpen,
      }}
    >
      {children}
    </ConversationThemeContext.Provider>
  );
}

export function useConversationTheme() {
  const context = useContext(ConversationThemeContext);
  if (!context) {
    // Graceful fallback when outside provider
    return {
      theme: DEFAULT_THEME,
      currentPreset: WALLPAPER_PRESETS[0],
      currentBubblePreset: BUBBLE_PRESETS[0],
      setWallpaperId: () => {},
      setCustomWallpaperUrl: () => {},
      setDefaultEmoji: () => {},
      setBubbleStyleId: () => {},
      setShowBubbleIcon: () => {},
      resetTheme: () => {},
      isWallpaperPickerOpen: false,
      setIsWallpaperPickerOpen: () => {},
      isEmojiPickerOpen: false,
      setIsEmojiPickerOpen: () => {},
      isBubblePickerOpen: false,
      setIsBubblePickerOpen: () => {},
    };
  }
  return context;
}
