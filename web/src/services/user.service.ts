import baseRequest from './base.service';
import type { ApiResponse, UpdateUserPayload, User } from '@/type';

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
   * Retrieves all users.
   * Endpoint: GET /v1/users
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await baseRequest.get<ApiResponse<User[]>>('/v1/users');
    return response.data;
  },
};

export default userService;
