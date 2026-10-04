import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata = {
  title: "Hồ sơ cá nhân & Cài đặt | WeTalk",
  description: "Quản lý thông tin cá nhân, cài đặt tài khoản và bảo mật trên WeTalk.",
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
