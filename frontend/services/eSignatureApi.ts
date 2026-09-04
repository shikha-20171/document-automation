import api, { type ApiResponse } from "./api";

export const eSignatureApi = {
  /** Get signature envelopes */
  getEnvelopes: async (params?: Record<string, any>): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/e-signature/envelopes", { params });
    return data;
  },

  /** Get single envelope */
  getEnvelopeById: async (id: string | number): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>(`/e-signature/envelopes/${id}`);
    return data;
  },

  /** Create envelope */
  createEnvelope: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/e-signature/envelopes", payload);
    return data;
  },

  /** Sign envelope */
  signEnvelope: async (envelopeId: string | number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/e-signature/envelopes/${envelopeId}/sign`, payload);
    return data;
  },
};

export default eSignatureApi;
