import { AxiosError } from "axios";
import { get, post } from "@/lib/api";
import type {
  CheckoutSession,
  CreditCardFormData,
  DebitCardFormData,
  PaymentResult,
} from "@/shared/schema";

export type VerifyCpfResponse = {
  valid: boolean;
  message?: string;
};

type PaymentMethodPayload =
  | ({ method: "credit" } & CreditCardFormData)
  | ({ method: "debit" } & DebitCardFormData)
  | { method: "pix" };

export function getCheckoutSession(sessionId: string) {
  return get<CheckoutSession>(`/api/checkout/${sessionId}`);
}

export function verifyCheckoutCpf(sessionId: string, cpf: string) {
  return post<VerifyCpfResponse>(`/api/checkout/${sessionId}/verify-cpf`, { cpf });
}

export function payCheckoutSession(sessionId: string, payload: PaymentMethodPayload) {
  return post<PaymentResult>(`/api/checkout/${sessionId}/pay`, payload);
}

export function getAxiosStatus(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.status;
  }

  return undefined;
}
