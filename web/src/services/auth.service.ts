import baseRequest from './base.service';
import type { ApiResponse, AuthUser, LoginPayload, LoginResponseData, RegisterPayload } from '@/type';

/**
 * Extracts a human-readable error message from backend error responses or exceptions.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const errorObj = error as {
      error?: { code?: string; message?: string };
      message?: string;
    };

    if (errorObj.error?.message) {
      return errorObj.error.message;
    }
    if (errorObj.message) {
      return errorObj.message;
    }
  }

  return 'Có lỗi xảy ra, vui lòng thử lại';
}

export const authService = {
  /**
   * Registers a new user account.
   * Endpoint: POST /v1/auth/register (full: http://localhost:8080/api/v1/auth/register)
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<AuthUser>> {
    const response = await baseRequest.post<ApiResponse<AuthUser>>(
      '/v1/auth/register',
      payload
    );
    return response.data;
  },

  /**
   * Logs into an existing user account.
   * Endpoint: POST /v1/auth/login (full: http://localhost:8080/api/v1/auth/login)
   */
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
    const response = await baseRequest.post<ApiResponse<LoginResponseData>>(
      '/v1/auth/login',
      payload
    );
    return response.data;
  },
};

export default authService;
