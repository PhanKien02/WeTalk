import baseRequest from './base.service';
import type { ApiResponse, QueryUsersParams, UpdateUserPayload, User } from '@/type';
import axios from 'axios';

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8080';

export const userService = {
  /**
   * Updates user information by user ID.
   * Endpoint: PUT /v1/users/:id (cURL: PUT http://localhost:8080/api/v1/users/<USER_ID>)
   * Headers:
   *   Authorization: Bearer <YOUR_ACCESS_TOKEN> (injected automatically via baseRequest)
   *   Content-Type: application/json
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<ApiResponse<string>> {
    const response = await baseRequest.put<ApiResponse<string>>(
      `/v1/users/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Retrieves user information by ID.
   * Endpoint: GET /v1/users/:id
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await baseRequest.get<ApiResponse<User>>(`/v1/users/${id}`);
    return response.data;
  },

  /**
   * Retrieves all users with optional pagination and search parameters.
   * Direct Endpoint: GET http://localhost:8082/api/v1/users?limit=10&offset=0&search=kien
   */
  async getAllUsers(params?: QueryUsersParams): Promise<ApiResponse<User[]>> {
    try {
      const response = await axios.get<ApiResponse<User[]>>(
        `${USER_SERVICE_URL}/api/v1/users`,
        { params }
      );
      return response.data;
    } catch {
      // Fallback via API gateway
      const response = await baseRequest.get<ApiResponse<User[]>>('/v1/users', {
        params,
      });
      return response.data;
    }
  },
};

export default userService;
