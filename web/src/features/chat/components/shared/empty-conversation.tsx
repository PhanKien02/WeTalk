"use client";

import { MessageSquareDashed } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function EmptyConversation() {
  const { t } = useI18n();

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-background dark:bg-[#0f111a] text-center p-8 select-none transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
        <MessageSquareDashed className="w-8 h-8 stroke-2" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">{t.emptyChat}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{t.emptyChatSub}</p>
    </div>
  );
}
