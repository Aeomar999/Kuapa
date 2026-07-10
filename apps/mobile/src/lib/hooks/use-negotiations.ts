import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { negotiationsApi, CreateNegotiationPayload } from "../api/negotiations";

export const NEGOTIATION_KEYS = {
  all: ["negotiations"] as const,
  buyer: ["negotiations", "buyer"] as const,
};

export function useCreateNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNegotiationPayload) =>
      negotiationsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NEGOTIATION_KEYS.buyer });
    },
  });
}

export function useBuyerNegotiations() {
  return useQuery({
    queryKey: NEGOTIATION_KEYS.buyer,
    queryFn: () => negotiationsApi.getBuyerNegotiations().then((r) => r.data),
  });
}
