/**
 * BackendStorage — implements IStorage using the real Python payment backend.
 * Activated automatically when the BACKEND_URL environment variable is set.
 *
 * Provider routing:
 *   - Credit / Debit card → e.Rede  (PROVIDER_CARD)
 *   - PIX                → Santander (PROVIDER_PIX)
 *
 * Payment flow per method:
 *   1. Obtain provider token  (POST /auth/token/{provider})
 *   2. Execute transaction    (POST|PUT /transactions/{method})
 *
 * The backend returns { customer, order, session } which is flattened into
 * the CheckoutSession shape consumed by the frontend.
 */

import type { CheckoutSession, PaymentResult } from "@/shared/schema";
import type { IStorage } from "./storage";
import {
  sessionsApi,
  authApi,
  transactionsApi,
  withRetry,
  PROVIDER_CARD,
  PROVIDER_PIX,
  type ThreeDSecureData,
} from "@/lib/backendClient";

const DISTRIBUTOR_AFFILIATION = parseInt(
  process.env.BACKEND_DISTRIBUTOR_AFFILIATION ?? "0",
  10
);

// ─── Raw backend response types ───────────────────────────────────────────────

interface BackendCustomer {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  contact_id: string;
}

interface BackendOrder {
  id: number;
  customer_id: number;
  order_number: string;
  description: string;
  model: string;
  color: string;
  year: string;
  installments: number;
  amount: number;
  notes: string | null;
}

interface BackendSession {
  session_id: string;
  customer_id: number;
  order_id: number;
  status: string;
  deal_type: string;
  completed_method: string | null;
  expires_at: string;
  failure_reason: string | null;
}

interface BackendResponse {
  customer: BackendCustomer;
  order: BackendOrder;
  session: BackendSession;
}

interface PaymentData {
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  installments?: number;
  amount?: string | number;
  browserData?: {
    userAgent: string;
    colorDepth: number;
    javaEnabled: boolean;
    language: string;
    screenHeight: number;
    screenWidth: number;
    timeZoneOffset: number;
  };
  customerEmail?: string;
  customerPhone?: string;
  _clientIp?: string;
}

// ─── Standardized error messages ──────────────────────────────────────────────

const ERROR_MESSAGES = {
  sessionNotFound: "Sessão não encontrada.",
  alreadyApproved: "Este pagamento já foi confirmado.",
  expired: "Esta sessão expirou. Solicite um novo link.",
  tokenFailed: "Não foi possível autenticar com o provedor de pagamento.",
  paymentDeclined: "Pagamento recusado pela operadora. Verifique os dados e tente novamente.",
  genericPayment: "Erro ao processar pagamento. Tente novamente.",
  cancelFailed: "Não foi possível cancelar a sessão.",
} as const;

// ─── BackendStorage ───────────────────────────────────────────────────────────

export class BackendStorage implements IStorage {
  // ── Sessions ──────────────────────────────────────────────────────────────

  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | undefined> {
    try {
      const raw = await sessionsApi.get<BackendResponse>(sessionId);
      return this.flatten(raw);
    } catch {
      return undefined;
    }
  }

  async validateSession(
    sessionId: string
  ): Promise<{ valid: boolean; session?: CheckoutSession; reason?: string }> {
    const session = await this.getCheckoutSession(sessionId);
    if (!session) return { valid: false, reason: "not_found" };

    if (session.status === "approved")  return { valid: false, session, reason: "approved" };
    if (session.status === "expired")   return { valid: false, session, reason: "expired" };
    if (session.status === "cancelled") return { valid: false, session, reason: "cancelled" };

    return { valid: true, session };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async verifyCpf(
    sessionId: string,
    cpf: string
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      await authApi.verify(sessionId, cpf);
      return { valid: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("401") || msg.includes("422")) {
        return { valid: false, message: "CPF não corresponde ao cadastro desta compra." };
      }
      throw err;
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancelSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await sessionsApi.update(sessionId, "cancelled");
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : ERROR_MESSAGES.cancelFailed;
      return { success: false, message: msg };
    }
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  /**
   * Routes the payment to the correct provider based on method:
   *   - "credit" → e.Rede token  → POST credit-card
   *   - "debit"  → e.Rede token  → POST debit-card
   *   - "pix"    → Santander token → PUT pix
   *
   * Each route: (1) acquire provider token, (2) execute transaction.
   * Both steps are wrapped with retry on transient failures.
   */
  async processPayment(
    sessionId: string,
    method: string,
    rawData: unknown
  ): Promise<PaymentResult> {
    const data = rawData as PaymentData;
    const amount = typeof data.amount === "number"
      ? data.amount
      : parseFloat(String(data.amount ?? "0"));

    try {
      if (method === "credit") return await this.processCreditCard(sessionId, data, amount);
      if (method === "debit")  return await this.processDebitCard(sessionId, data, amount);
      if (method === "pix")    return await this.processPix(sessionId, data, amount);

      return { success: false, message: `Método de pagamento desconhecido: ${method}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : ERROR_MESSAGES.genericPayment;

      // Surface provider-level declines with a clear message
      if (msg.includes("declined") || msg.includes("recusad") || msg.includes("422")) {
        return { success: false, message: ERROR_MESSAGES.paymentDeclined };
      }

      return { success: false, message: ERROR_MESSAGES.genericPayment };
    }
  }

  // ── Private — transaction implementations ─────────────────────────────────

  /**
   * Credit card: e.Rede token → POST /transactions/credit-card
   */
  private async processCreditCard(
    sessionId: string,
    data: PaymentData,
    amount: number
  ): Promise<PaymentResult> {
    // Step 1: obtain e.Rede token (retry once on transient failure)
    await withRetry(() => authApi.token(sessionId, PROVIDER_CARD));

    // Step 2: execute credit card transaction
    const result = await withRetry(() =>
      transactionsApi.creditCard(sessionId, {
        cardholderName: data.cardholderName ?? "",
        cardNumber: (data.cardNumber ?? "").replace(/\s/g, ""),
        expiryDate: data.expiryDate ?? "",
        cvv: data.cvv ?? "",
        installments: data.installments ?? 1,
        amount,
        distributorAffiliation: DISTRIBUTOR_AFFILIATION,
      })
    );

    const res = result as Record<string, unknown>;
    return {
      success: true,
      transaction_id: String(res?.transaction_id ?? res?.id ?? ""),
      message: "Pagamento aprovado com sucesso!",
    };
  }

  /**
   * Debit card: e.Rede token → POST /transactions/debit-card
   */
  private async processDebitCard(
    sessionId: string,
    data: PaymentData,
    amount: number
  ): Promise<PaymentResult> {
    // Step 1: obtain e.Rede token
    await withRetry(() => authApi.token(sessionId, PROVIDER_CARD));

    // Step 2: execute debit card transaction
    const result = await withRetry(() =>
      transactionsApi.debitCard(sessionId, {
        cardholderName: data.cardholderName ?? "",
        cardNumber: (data.cardNumber ?? "").replace(/\s/g, ""),
        expiryDate: data.expiryDate ?? "",
        cvv: data.cvv ?? "",
        amount,
        distributorAffiliation: DISTRIBUTOR_AFFILIATION,
        threeDSecure: this.buildThreeDSecure(data),
      })
    );

    const res = result as Record<string, unknown>;
    return {
      success: true,
      transaction_id: String(res?.transaction_id ?? res?.id ?? ""),
      message: "Pagamento aprovado com sucesso!",
    };
  }

  /**
   * PIX: Santander token → PUT /transactions/pix
   */
  private async processPix(
    sessionId: string,
    data: PaymentData,
    amount: number
  ): Promise<PaymentResult> {
    // Step 1: obtain Santander token
    await withRetry(() => authApi.token(sessionId, PROVIDER_PIX));

    // Step 2: create PIX transaction
    const result = await withRetry(() =>
      transactionsApi.pix(sessionId, {
        amount,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      })
    );

    const res = result as Record<string, unknown>;
    return {
      success: true,
      transaction_id: String(res?.transaction_id ?? res?.id ?? ""),
      pix_code: String(res?.pix_code ?? res?.code ?? res?.emv ?? ""),
      pix_qr_code: String(res?.pix_qr_code ?? res?.qr_code ?? res?.qrCode ?? ""),
      message: "PIX gerado com sucesso. Aguardando pagamento.",
    };
  }

  // ── Private — helpers ─────────────────────────────────────────────────────

  /**
   * Flattens { customer, order, session } from the backend into the
   * flat CheckoutSession shape used by the frontend.
   */
  private flatten(raw: BackendResponse): CheckoutSession {
    return {
      session_id: raw.session.session_id,
      status: raw.session.status as CheckoutSession["status"],
      deal_type: raw.session.deal_type as CheckoutSession["deal_type"],
      completed_method: raw.session.completed_method as CheckoutSession["completed_method"],
      expires_at: raw.session.expires_at,
      failure_reason: raw.session.failure_reason,
      customer: {
        id: raw.customer.id,
        name: raw.customer.name,
        cpf: raw.customer.cpf,
        phone: raw.customer.phone,
        email: raw.customer.email,
        contact_id: raw.customer.contact_id,
      },
      order: {
        id: raw.order.id,
        order_number: raw.order.order_number,
        description: raw.order.description,
        model: raw.order.model,
        color: raw.order.color,
        year: raw.order.year,
        installments: raw.order.installments,
        amount: raw.order.amount,
        notes: raw.order.notes,
      },
    };
  }

  private buildThreeDSecure(data: PaymentData): ThreeDSecureData {
    const browser = data.browserData;
    return {
      userAgent: browser?.userAgent ?? "",
      ipAddress: data._clientIp ?? "0.0.0.0",
      device: {
        colorDepth: browser?.colorDepth ?? 24,
        deviceType3ds: "browser",
        javaEnabled: browser?.javaEnabled ?? false,
        language: browser?.language ?? "pt-BR",
        screenHeight: browser?.screenHeight ?? 768,
        screenWidth: browser?.screenWidth ?? 1366,
        timeZoneOffset: browser?.timeZoneOffset ?? 180,
      },
      billing: {
        address: "",
        city: "",
        postalcode: "",
        state: "",
        country: "BR",
        emailAddress: data.customerEmail ?? "",
        phoneNumber: data.customerPhone ?? "",
      },
    };
  }
}
