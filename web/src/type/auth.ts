import type { User } from "./chat";

export enum AuthModeEnum {
  SIGNIN = "signin",
  SIGNUP = "signup",
}

export const AuthMode = AuthModeEnum;
export type AuthMode = "signin" | "signup" | AuthModeEnum;
export type AuthModeType = AuthMode;

export interface AuthFormValues {
  email: string;
  password: string;
  fullName?: string;
}

export interface ForgotPasswordValues {
  forgotEmail: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => void;
}
