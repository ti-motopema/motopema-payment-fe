import { backendRequest } from "@/lib/backend/http";

export function getCheckoutSession(sessionId: string) {
  console.log("Fetching checkout session with ID:", sessionId);
  return backendRequest({
    path: `/webhook/payment-session/${sessionId}`,
    method: "GET",
  });
}

export function verifyCheckoutCpf(sessionId: string, body: unknown) {
  return backendRequest({
    path: `/webhook/payment-session/${sessionId}/verify-cpf`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function payCheckoutSession(sessionId: string, body: unknown) {
  return backendRequest({
    path: `/webhook/payment-session/${sessionId}/pay`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
