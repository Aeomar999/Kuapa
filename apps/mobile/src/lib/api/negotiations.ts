import { apiClient } from "./client";

export interface CreateNegotiationPayload {
  productId: string;
  proposedPrice: number;
  proposedQuantity: number;
  message?: string;
}

export const negotiationsApi = {
  create: (data: CreateNegotiationPayload) => apiClient.post("/negotiations", data),
  getBuyerNegotiations: () => apiClient.get("/negotiations/buyer"),
};
