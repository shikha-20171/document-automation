import api, { type ApiResponse } from "../api";
import type { AISaveDocumentRequest } from "../types/ai";

export const aiDocumentService = {
  /**
   * Save AI generated text / document to organization / department vault
   */
  saveAiContentAsDocument: async (payload: AISaveDocumentRequest): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/documents/from-ai", payload);
    return data;
  },
};

export default aiDocumentService;
