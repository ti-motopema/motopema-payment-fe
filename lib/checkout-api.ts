import { AxiosError } from "axios";
import { get, post } from "@/lib/api";
import type {
  CreditCardFormData,
  DebitCardFormData,
} from "@/shared/schema";


export type VerifyCpfResponse = {
  success: boolean;
  message?: string;
};


export interface CheckoutSessionRequest {
  sessionId: string;
}

export interface PaymentProviderAccessTokenResponse {
  success: boolean;
  is_token_already_exist?: boolean | null;
  message?: string;
}



// BUSCA DE CHECKOUT SESSION
// export function getCheckoutSession(sessionId: string) {
//   return get(`/api/checkout/${sessionId}`);
// }


// // OBTENÇÃO DE TOKEN DE ACESSO PARA PROVEDOR DE PAGAMENTO
// export function getPaymentProviderAccessToken() {
//   return post(`/api/checkout/token`);
// }

export function fetchCheckoutSession({
  sessionId,
}: CheckoutSessionRequest) {
  return get(`/api/checkout/${sessionId}`);
}

// OBTENÇÃO DE TOKEN DE ACESSO PARA PROVEDOR DE PAGAMENTO
export function requestPaymentProviderAccessToken({
  sessionId,
}: CheckoutSessionRequest) {
  return post<PaymentProviderAccessTokenResponse>(`/api/checkout/${sessionId}/auth/token`);
}

// TRANSAÇÕES DE CARTÃO DE CRÉDITO E DÉBITO
// export function debitCardTransaction(sessionId: string, payload: DebitCardFormData) {
//   return post(`/api/checkout/${sessionId}/transaction/debit`, { method: "debit", ...payload });
// }

// export function creditCardTransaction(sessionId: string, payload: CreditCardFormData, token: string) {
//   return post(`/api/checkout/${sessionId}/transaction/credit`, { method: "credit", ...payload, accessToken: token });
// }

export interface CardDebitTransactionRequest {
  sessionId: string;
  payload: DebitCardFormData & {
    amount: number;
    threeDSecure: {
      device: {
        colorDepth: number;
        deviceType3ds: string;
        javaEnabled: boolean;
        language: string;
        screenHeight: number;
        screenWidth: number;
        timeZoneOffset: number;
      };
    };
  };
}

export interface CardCreditTransactionRequest {
  sessionId: string;
  payload: CreditCardFormData & {
    amount: number;
  };
}


// TRANSAÇÃO DE CARTÃO DE DÉBITO
export function createDebitCardTransaction({
  sessionId,
  payload,
}: CardDebitTransactionRequest) {
  return post(`/api/checkout/${sessionId}/transactions/debit-card`, {
    ...payload,
  });
}


export function createCreditCardTransaction({
  sessionId,
  payload,
}: CardCreditTransactionRequest) {
  return post(`/api/checkout/${sessionId}/transactions/credit-card`, {
    ...payload,
  });
}


export function verifyCheckoutCpf(sessionId: string, cpf: string, expiresAt: string) {
  return post<VerifyCpfResponse>(`/api/checkout/${sessionId}/auth/verify`, { cpf, expiresAt });
}


export function getAxiosStatus(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.status;
  }

  return undefined;
}
