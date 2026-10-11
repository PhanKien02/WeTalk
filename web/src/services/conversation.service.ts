import baseRequest from "./base.service";
import type {
  ApiResponse,
  CreateConversationPayload,
  QueryConversationsParams,
  RawConversation,
} from "@/type";

export const conversationService = {
  async getAllConversations(
    params?: QueryConversationsParams,
    config?: { signal?: AbortSignal }
  ): Promise<ApiResponse<RawConversation[]>> {
    const response = await baseRequest.get<ApiResponse<RawConversation[]>>(
      "/v1/conversations",
      {
        params,
        signal: config?.signal,
      }
    );
    return response.data;
  },

  async getConversationById(
    id: string
  ): Promise<ApiResponse<RawConversation>> {
    const response = await baseRequest.get<ApiResponse<RawConversation>>(
      `/v1/conversations/${id}`
    );
    return response.data;
  },

  async createConversation(
    payload: CreateConversationPayload
  ): Promise<ApiResponse<RawConversation>> {
    const response = await baseRequest.post<ApiResponse<RawConversation>>(
      "/v1/conversations",
      payload
    );
    return response.data;
  },
};

export default conversationService;
