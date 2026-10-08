"use client";

import { useState } from "react";
import { authService, getAuthErrorMessage } from "@/services/auth.service";
import { useAuth } from "@/lib/auth";
import type { ApiResponse, LoginPayload, LoginResponseData } from "@/type";

export interface UseLoginReturn {
  isLoading: boolean;
  error: string | null;
  loginUser: (payload: LoginPayload) => Promise<ApiResponse<LoginResponseData>>;
  resetState: () => void;
  setError: (error: string | null) => void;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuthSession } = useAuth();

  const resetState = () => {
    setError(null);
  };

  const loginUser = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(payload);
      if (response.data?.token && response.data?.user) {
        const { token, user } = response.data;
        await setAuthSession(user.email || payload.login, user.name, token, {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        });
      }
      return response;
    } catch (err: unknown) {
      const rawMessage = getAuthErrorMessage(err);
      let formattedMessage = rawMessage;

      if (rawMessage.includes("record not found")) {
        formattedMessage = "Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc số điện thoại.";
      } else if (rawMessage.includes("invalid password")) {
        formattedMessage = "Mật khẩu không chính xác. Vui lòng thử lại.";
      }

      setError(formattedMessage);
      throw new Error(formattedMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    loginUser,
    resetState,
    setError,
  };
}
