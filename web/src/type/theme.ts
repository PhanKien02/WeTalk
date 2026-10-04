import type React from "react";
import type { Translations } from "./i18n";

export interface WallpaperPreset {
  id: string;
  nameKey: keyof Translations;
  nameFallback: string;
  className: string;
  style?: React.CSSProperties;
  previewBg: string;
  isDark?: boolean;
}

export interface BubblePreset {
  id: string;
  nameKey?: keyof Translations;
  nameFallback: string;
  tag: string;
  description: string;
  ownBubbleClass: string;
  incomingBubbleClass: string;
  shapeClass: string;
  incomingShapeClass: string;
  iconEmoji: string;
  iconName: string;
  previewBg: string;
}

export interface EmojiOption {
  emoji: string;
  name: string;
}

export interface ConversationThemeState {
  wallpaperId: string;
  customWallpaperUrl?: string;
  defaultEmoji: string;
  bubbleStyleId?: string;
  showBubbleIcon?: boolean;
}

export interface ConversationThemeContextType {
  theme: ConversationThemeState;
  currentPreset: WallpaperPreset;
  currentBubblePreset: BubblePreset;
  setWallpaperId: (id: string) => void;
  setCustomWallpaperUrl: (url: string | undefined) => void;
  setDefaultEmoji: (emoji: string) => void;
  setBubbleStyleId: (id: string) => void;
  setShowBubbleIcon: (show: boolean) => void;
  resetTheme: () => void;
  isWallpaperPickerOpen: boolean;
  setIsWallpaperPickerOpen: (open: boolean) => void;
  isEmojiPickerOpen: boolean;
  setIsEmojiPickerOpen: (open: boolean) => void;
  isBubblePickerOpen: boolean;
  setIsBubblePickerOpen: (open: boolean) => void;
}

export interface ConversationThemeProviderProps {
  conversationId: string;
  children: React.ReactNode;
}

