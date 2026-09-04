import api, { type ApiResponse } from "../api";
import type { AIProviderOption, AIChatMessage, AIConversation } from "../types/ai";

export const aiChatService = {
  /**
   * Get all AI models permitted for the organization from backend
   */
  getAvailableModels: async (): Promise<{
    success: boolean;
    planName?: string;
    providers: AIProviderOption[];
    allProviders?: any[];
  }> => {
    const { data } = await api.get<any>("/ai/available-models");
    return data;
  },

  /**
   * Send a chat prompt through the central AI Gateway
   */
  sendMessage: async (payload: {
    conversationId?: string;
    message: string;
    provider?: string;
    model?: string;
    attachmentName?: string;
    attachmentUrl?: string;
  }): Promise<{
    success: boolean;
    conversationId: string;
    title: string;
    message: AIChatMessage;
  }> => {
    const { data } = await api.post<any>("/ai/chat", payload);
    return data;
  },

  /**
   * List conversation threads
   */
  getConversations: async (): Promise<ApiResponse<AIConversation[]>> => {
    const { data } = await api.get<ApiResponse<AIConversation[]>>("/ai/conversations");
    return data;
  },

  /**
   * Get single conversation thread with message history
   */
  getConversationById: async (id: string): Promise<ApiResponse<AIConversation>> => {
    const { data } = await api.get<ApiResponse<AIConversation>>(`/ai/conversations/${id}`);
    return data;
  },

  /**
   * Delete conversation thread
   */
  deleteConversation: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/ai/conversations/${id}`);
    return data;
  },
};

export default aiChatService;
