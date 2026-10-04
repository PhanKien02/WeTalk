import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";

export default function ConversationNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-white text-center p-8 select-none">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-100">
        <MessageSquareWarning className="w-8 h-8 stroke-2" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 mb-1">
        Không tìm thấy hội thoại
      </h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">
        Hội thoại bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link
        href="/messages"
        className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
      >
        Quay lại danh sách tin nhắn
      </Link>
    </div>
  );
}
