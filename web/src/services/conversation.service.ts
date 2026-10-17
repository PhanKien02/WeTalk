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
    const response = await baseRequest.get<
      ApiResponse<RawConversation> | RawConversation
    >(`/v1/conversations/${id}`);
    const payload = response.data;
    if (payload && typeof payload === "object" && "data" in payload && payload.data) {
      return payload as ApiResponse<RawConversation>;
    }
    return {
      success: true,
      data: payload as RawConversation,
    };
  },

  async createConversation(
    payload: CreateConversationPayload
  ): Promise<ApiResponse<RawConversation>> {
    const response = await baseRequest.post<
      ApiResponse<RawConversation> | RawConversation
    >("/v1/conversations", payload);
    const resData = response.data;
    if (resData && typeof resData === "object" && "data" in resData && resData.data) {
      return resData as ApiResponse<RawConversation>;
    }
    return {
      success: true,
      data: resData as RawConversation,
    };
  },
};

export default conversationService;
