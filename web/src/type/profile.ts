export enum ProfileTabKeyEnum {
  PROFILE = "profile",
  NOTIFICATIONS = "notifications",
  SECURITY = "security",
}

export const ProfileTabKey = ProfileTabKeyEnum;
export type ProfileTabKey =
  | "profile"
  | "notifications"
  | "security"
  | ProfileTabKeyEnum;
export type ProfileTabKeyType = ProfileTabKey;

export interface ProfileFormValues {
  name: string;
  username: string;
  roleTitle: string;
  phone: string;
  department: string;
  bio: string;
}

export interface ChangeEmailValues {
  newEmail: string;
}

export interface ChangePasswordValues {
  oldPassword: string;
  newPassword: string;
}

export interface ProfileTabProps {
  onShowToast: (msg: string, canUndoAvatar?: boolean) => void;
  avatarSrc: string | null;
  setAvatarSrc: (src: string | null) => void;
  setPrevAvatarSrc: (src: string | null) => void;
}

export interface SecurityTabProps {
  onShowToast: (msg: string) => void;
}
