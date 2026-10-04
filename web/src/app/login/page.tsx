import { AuthPage } from "@/features/auth/components/auth-page";

export const metadata = {
  title: "Đăng nhập | WeTalk",
  description: "Đăng nhập vào WeTalk để kết nối và trò chuyện cùng đội nhóm của bạn.",
};

export default function LoginPage() {
  return <AuthPage />;
}
