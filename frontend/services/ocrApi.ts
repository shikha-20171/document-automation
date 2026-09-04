import api, { type ApiResponse } from "./api";

export const ocrApi = {
  /** Run OCR text recognition on document/image */
  runOcr: async (payload: any): Promise<ApiResponse> => {
    let base64String = payload.imageBase64;
    if (!base64String && payload.file) {
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(payload.file);
      });
    }

    const { data } = await api.post<ApiResponse>("/ai/ocr", {
      imageBase64: base64String,
      documentText: payload.documentText || payload.scannedContent,
      fileName: payload.fileName || payload.file?.name || "Document",
      language: payload.language || "English",
      provider: payload.provider,
      model: payload.model,
    });
    return data;
  },

  /** Digitize an uploaded file via OCR */
  digitize: async (file: File, language = "English"): Promise<ApiResponse> => {
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { data } = await api.post<ApiResponse>("/ai/ocr", {
      imageBase64: base64String,
      fileName: file.name,
      language,
    });
    return data;
  },

  /** Get active OCR engines status (Super Admin) */
  getOcrEngines: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/ai-management/ocr-engines");
    return data;
  },

  /** Get OCR processing requests queue (Super Admin) */
  getOcrRequests: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/ai-management/ocr-requests");
    return data;
  },
};

export default ocrApi;
