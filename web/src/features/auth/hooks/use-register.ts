"use client";

import { useState } from "react";
import { authService, getAuthErrorMessage } from "@/services/auth.service";
import type { ApiResponse, AuthUser, RegisterPayload } from "@/type";

export interface UseRegisterReturn {
  isLoading: boolean;
  error: string | null;
  successData: AuthUser | null;
  registerUser: (payload: RegisterPayload) => Promise<ApiResponse<AuthUser>>;
  resetState: () => void;
  setError: (error: string | null) => void;
}

export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<AuthUser | null>(null);

  const resetState = () => {
    setError(null);
    setSuccessData(null);
  };

  const registerUser = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(payload);
      if (response.data) {
        setSuccessData(response.data);
      }
      return response;
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    successData,
    registerUser,
    resetState,
    setError,
  };
}
