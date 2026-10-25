import baseRequest from "./base.service";
import type {
  ApiResponse,
  CreateMessagePayload,
  QueryMessagesParams,
  RawMessage,
} from "@/type";

export const messageService = {
  /** Tin nhắn mới nhất trước; truyền `before` để lấy trang cũ hơn */
  async getMessages(
    params: QueryMessagesParams,
    config?: { signal?: AbortSignal }
  ): Promise<ApiResponse<RawMessage[]>> {
    const response = await baseRequest.get<ApiResponse<RawMessage[]>>(
      "/v1/messages",
      { params, signal: config?.signal }
    );
    return response.data;
  },

  async sendMessage(
    payload: CreateMessagePayload
  ): Promise<ApiResponse<RawMessage>> {
    const response = await baseRequest.post<ApiResponse<RawMessage>>(
      "/v1/messages",
      payload
    );
    return response.data;
  },

  async updateMessage(
    id: string,
    content: string
  ): Promise<ApiResponse<RawMessage>> {
    const response = await baseRequest.put<ApiResponse<RawMessage>>(
      `/v1/messages/${id}`,
      { content }
    );
    return response.data;
  },

  async deleteMessage(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await baseRequest.delete<ApiResponse<{ id: string }>>(
      `/v1/messages/${id}`
    );
    return response.data;
  },
};

export default messageService;
