/**
 * Typed HTTP client for the Motopema Python payment backend.
 * Server-side only — used exclusively in Next.js Route Handlers.
 *
 * Required env vars (no NEXT_PUBLIC_ prefix):
 *   BACKEND_URL                      – Python API base URL
 *   BACKEND_CLIENT_ID                – Payment provider client_id
 *   BACKEND_CLIENT_SECRET            – Payment provider client_secret
 *   BACKEND_DISTRIBUTOR_AFFILIATION  – Distributor affiliation code (defaults to 0)
 */

import { randomUUID } from "crypto";

// ─── Payment providers ────────────────────────────────────────────────────────

/** e.Rede: handles credit and debit card payments. */
export const PROVIDER_CARD = "erede" as const;
/** Santander: handles PIX payments. */
export const PROVIDER_PIX  = "santander" as const;

export type PaymentProvider = typeof PROVIDER_CARD | typeof PROVIDER_PIX;

// ─── Payload types ────────────────────────────────────────────────────────────

export interface ThreeDSecureDevice {
  colorDepth: number;
  deviceType3ds: string;
  javaEnabled: boolean;
  language: string;
  screenHeight: number;
  screenWidth: number;
  timeZoneOffset: number;
}

export interface ThreeDSecureBilling {
  address: string;
  city: string;
  postalcode: string;
  state: string;
  country: string;
  emailAddress: string;
  phoneNumber: string;
}

export interface ThreeDSecureData {
  userAgent: string;
  ipAddress: string;
  device: ThreeDSecureDevice;
  billing: ThreeDSecureBilling;
}

/** POST /payments/sessions/{session_id}/transactions/credit-card */
export interface CreditCardPayload {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  installments: number;
  distributorAffiliation: number;
}

/** POST /payments/sessions/{session_id}/transactions/debit-card */
export interface DebitCardPayload {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  distributorAffiliation: number;
  threeDSecure: ThreeDSecureData;
}

/** PUT /payments/sessions/{session_id}/transactions/pix */
export interface PixPayload {
  cpf: string;
  name: string;
  payer_request: string;
  expiration: number;
}

export interface SessionUpdatePayload {
  status: string;
}

// ─── Idempotency key ──────────────────────────────────────────────────────────

/**
 * Generates a unique idempotency key (UUID v4, 36 chars).
 * Required header for all transaction requests (minLength: 8, maxLength: 128).
 */
export function generateIdempotencyKey(): string {
  return randomUUID();
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function baseUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error("BACKEND_URL environment variable is not set.");
  return url.replace(/\/$/, "");
}

/**
 * Attempts to extract a human-readable error message from a failed response.
 * Tries JSON body first (detail / message / error fields), then raw text.
 */
async function extractErrorMessage(res: Response, method: string, path: string): Promise<string> {
  let detail: string | undefined;
  try {
    const body = await res.clone().json() as Record<string, unknown>;
    const raw = body?.detail ?? body?.message ?? body?.error;
    if (raw) detail = typeof raw === "string" ? raw : JSON.stringify(raw);
  } catch {
    try { detail = await res.text(); } catch { /* ignore */ }
  }
  const hint = detail ?? res.statusText ?? `HTTP ${res.status}`;
  return `[BackendClient] ${method} ${path} → ${res.status}: ${hint}`;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await extractErrorMessage(res, method, path);
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

/**
 * Retries an async operation with exponential backoff.
 *
 * Retries only on transient failures (network errors and HTTP 5xx).
 * Client errors (4xx) are thrown immediately without retrying.
 *
 * @param fn           - The operation to retry.
 * @param maxAttempts  - Maximum number of attempts (default: 2).
 * @param baseDelayMs  - Base delay in ms; doubles on each retry (default: 300ms).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 2, baseDelayMs = 300 }: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number }).status;
      // Do not retry client errors (4xx) — they won't change on retry
      if (status !== undefined && status >= 400 && status < 500) throw err;

      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
      }
    }
  }

  throw lastError;
}

// ─── Sessions API ─────────────────────────────────────────────────────────────

export const sessionsApi = {
  /**
   * GET /payments/sessions/{session_id}
   * Returns { customer, order, session } nested response.
   */
  get: <T = unknown>(sessionId: string): Promise<T> =>
    request<T>("GET", `/payments/sessions/${sessionId}`),

  /**
   * PATCH /payments/sessions/{session_id}
   * Updates session status (e.g., "cancelled").
   */
  update: <T = unknown>(sessionId: string, status: string): Promise<T> =>
    request<T>("PATCH", `/payments/sessions/${sessionId}`, { status } satisfies SessionUpdatePayload),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /payments/sessions/{session_id}/auth/token/{provider}
   *
   * Obtains a payment provider token for the given session.
   * Provider must match the payment method:
   *   - PROVIDER_CARD ("erede")     → credit and debit card payments
   *   - PROVIDER_PIX  ("santander") → PIX payments
   */
  token: <T = unknown>(sessionId: string, provider: PaymentProvider): Promise<T> =>
    request<T>("POST", `/payments/sessions/${sessionId}/auth/token/${provider}`, {
      client_id: process.env.BACKEND_CLIENT_ID ?? "",
      client_secret: process.env.BACKEND_CLIENT_SECRET ?? "",
    }),

  /**
   * POST /payments/sessions/{session_id}/auth/verify
   * Validates CPF ownership for the given session.
   */
  verify: <T = unknown>(sessionId: string, cpf: string): Promise<T> =>
    request<T>("POST", `/payments/sessions/${sessionId}/auth/verify`, { cpf }),
};

// ─── Transactions API ─────────────────────────────────────────────────────────

export const transactionsApi = {
  /**
   * POST /payments/sessions/{session_id}/transactions/credit-card
   * Provider: e.Rede (PROVIDER_CARD).
   * Header: Idempotency-Key (auto-generated per call).
   *
   * Body: cardholderName, cardNumber, expiryDate, cvv, installments,
   *       distributorAffiliation.
   * Note: amount is NOT sent — the backend reads it from the session.
   */
  creditCard: <T = unknown>(sessionId: string, payload: CreditCardPayload): Promise<T> =>
    request<T>(
      "POST",
      `/payments/sessions/${sessionId}/transactions/credit-card`,
      payload,
    ),

  /**
   * POST /payments/sessions/{session_id}/transactions/debit-card
   * Provider: e.Rede (PROVIDER_CARD).
   * Header: Idempotency-Key (auto-generated per call).
   *
   * Body: cardholderName, cardNumber, expiryDate, cvv, distributorAffiliation,
   *       threeDSecure { userAgent, ipAddress, device, billing }.
   * Note: amount and installments are NOT sent.
   */
  debitCard: <T = unknown>(sessionId: string, payload: DebitCardPayload): Promise<T> =>
    request<T>(
      "POST",
      `/payments/sessions/${sessionId}/transactions/debit-card`,
      payload,
    ),

  /**
   * PUT /payments/sessions/{session_id}/transactions/pix
   * Provider: Santander (PROVIDER_PIX).
   * Header: Idempotency-Key (auto-generated per call).
   *
   * Body: cpf, name, payer_request, expiration (seconds — default 1200).
   * Note: amount is NOT sent — the backend reads it from the session.
   */
  pix: <T = unknown>(sessionId: string, payload: PixPayload): Promise<T> =>
    request<T>(
      "PUT",
      `/payments/sessions/${sessionId}/transactions/pix`,
      payload,
    ),
};
