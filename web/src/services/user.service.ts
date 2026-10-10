import baseRequest from './base.service';
import type { ApiResponse, QueryUsersParams, UpdateUserPayload, User } from '@/type';

export const userService = {

  async updateUser(id: string, payload: UpdateUserPayload): Promise<ApiResponse<string>> {
    const response = await baseRequest.put<ApiResponse<string>>(
      `/v1/users/${id}`,
      payload
    );
    return response.data;
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await baseRequest.get<ApiResponse<User>>(`/v1/users/${id}`);
    return response.data;
  },

  async getAllUsers(params?: QueryUsersParams): Promise<ApiResponse<User[]>> {
    const response = await baseRequest.get<ApiResponse<User[]>>('/v1/users', {
      params,
    });
    console.log({ response })
    return response.data;
  },
};

export default userService;
