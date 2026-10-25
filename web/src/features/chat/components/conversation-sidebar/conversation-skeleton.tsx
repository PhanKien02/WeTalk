import { memo } from "react";

const SKELETON_WIDTHS = [
  { name: "45%", desc: "65%" },
  { name: "60%", desc: "75%" },
  { name: "75%", desc: "85%" },
  { name: "45%", desc: "95%" },
  { name: "60%", desc: "65%" },
  { name: "75%", desc: "75%" },
];

export const ConversationSidebarSkeleton = memo(
  function ConversationSidebarSkeleton({
    count = 6,
  }: {
    count?: number;
  }) {
    return (
      <div
        className="flex flex-col gap-1.5"
        role="status"
        aria-label="Loading conversations"
      >
        {Array.from({ length: count }).map((_, i) => {
          const widthProfile = SKELETON_WIDTHS[i % SKELETON_WIDTHS.length];
          return (
            <div
              key={i}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-white/5 animate-pulse"
            >
              {/* Avatar skeleton matching UserAvatar size="lg" */}
              <div className="w-12 h-12 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0 mt-0.5" />

              {/* Conversation meta skeleton */}
              <div className="flex-1 min-w-0 flex flex-col gap-2 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div
                    className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md"
                    style={{ width: widthProfile.name }}
                  />
                  <div className="h-3 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-md w-10 shrink-0" />
                </div>
                <div
                  className="h-3.5 bg-zinc-200/60 dark:bg-zinc-800/50 rounded-md"
                  style={{ width: widthProfile.desc }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

