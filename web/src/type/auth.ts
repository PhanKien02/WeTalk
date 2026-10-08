import type { User } from "./chat";

export enum AuthModeEnum {
  SIGNIN = "signin",
  SIGNUP = "signup",
}

export const AuthMode = AuthModeEnum;
export type AuthMode = "signin" | "signup" | AuthModeEnum;
export type AuthModeType = AuthMode;

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  refresh_token?: string;
  created_at?: number;
  updated_at?: number;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: unknown;
}

export interface AuthFormValues {
  email: string; // can contain email or phone for signin
  password: string;
  fullName?: string;
  phone?: string;
}

export interface ForgotPasswordValues {
  forgotEmail: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    loginOrEmail: string,
    name?: string,
    token?: string,
    userData?: Partial<User>
  ) => Promise<void>;
  logout: () => void;
}
