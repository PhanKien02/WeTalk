"use client";

import { useState } from "react";
import { userService } from "@/services/user.service";
import { getAuthErrorMessage } from "@/services/auth.service";
import { useAuth } from "@/lib/auth";
import type { ApiResponse, UpdateUserPayload } from "@/type";

export interface UseUpdateUserReturn {
  isLoading: boolean;
  error: string | null;
  updateUser: (
    userId: string,
    payload: UpdateUserPayload
  ) => Promise<ApiResponse<string>>;
  resetState: () => void;
  setError: (error: string | null) => void;
}

export function useUpdateUser(): UseUpdateUserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateUser: updateAuthUser } = useAuth();

  const resetState = () => {
    setError(null);
  };

  const updateUser = async (userId: string, payload: UpdateUserPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.updateUser(userId, payload);
      if (updateAuthUser) {
        updateAuthUser(payload);
      }
      return response;
    } catch (err: unknown) {
      const formattedMessage = getAuthErrorMessage(err);
      setError(formattedMessage);
      throw new Error(formattedMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    updateUser,
    resetState,
    setError,
  };
}
