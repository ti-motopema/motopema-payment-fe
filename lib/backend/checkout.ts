import { getPaymentProviderCredentials } from "@/lib/backend/config";
import { backendRequest } from "@/lib/backend/http";



export function fetchCheckoutSession(sessionId: string) {
  return backendRequest({
    path: `/payments/sessions/${sessionId}`,
    method: "GET",
  });
}


export function verifyCheckoutCpf(sessionId: string, body: unknown) {
  return backendRequest({
    // path: `/api/v1/payment-sessions/${sessionId}/validations/cpf`,
    path: `/payments/sessions/${sessionId}/auth/verify`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}


export function getAccessToken(body: {
  sessionId: string;
}) {
  return backendRequest({
    path: `/payments/sessions/${body.sessionId}/auth/token`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}


type AccessTokenPayload = {
  success: boolean;
  is_token_already_exist?: boolean | null;
  message?: string;
};


export async function requestPaymentProviderAccessToken(sessionId: string) {
  const response = await getAccessToken({
    sessionId,
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel obter o token do provedor de pagamento.");
  }

  const payload = (await response.json()) as AccessTokenPayload;

  if (!payload.success) {
    throw new Error(payload.message || "A resposta do backend nao confirmou a geracao do token.");
  }

  return {
    success: payload.success,
    isTokenAlreadyExist: payload.is_token_already_exist ?? null,
    message: payload.message,
  };
}


export function creditCardTransaction(sessionId: string, body: unknown, cookieHeader?: string) {
  return backendRequest({
    path: `/payments/sessions/${sessionId}/transactions/credit-card`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function debitCardTransaction(sessionId: string, body: unknown, cookieHeader?: string) {
  return backendRequest({
    path: `/payments/sessions/${sessionId}/transactions/debit-card`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}
