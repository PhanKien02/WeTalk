import conversationService from "@/services/conversation.service";
import type { ApiResponse, RawConversation } from "@/type";
import { useQuery } from "@tanstack/react-query";

export const useGetConversation = (id?: string) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiResponse<RawConversation>, Error>({
    queryKey: ["getConversationById", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Conversation ID is required");
      }
      const response = await conversationService.getConversationById(id);
      return response;
    },
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30000,
  });

  return {
    data,
    classes: data, // Backward compatibility
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
};

export type BookingHook = ReturnType<typeof useGetConversation>;

export default useGetConversation;