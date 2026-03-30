import type { CheckoutSession, PaymentResult } from "@/shared/schema";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

export interface IStorage {
  getCheckoutSession(sessionId: string): Promise<CheckoutSession | undefined>;
  processPayment(sessionId: string, method: string, data: unknown): Promise<PaymentResult>;
  validateSession(sessionId: string): Promise<{ valid: boolean; session?: CheckoutSession; reason?: string }>;
  verifyCpf(sessionId: string, cpf: string): Promise<{ valid: boolean; message?: string }>;
  cancelSession(sessionId: string): Promise<{ success: boolean; message?: string }>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, CheckoutSession>;

  constructor() {
    this.sessions = new Map();
    const now = new Date();

    const mockSession: CheckoutSession = {
      session_id: "sess_mtp_2024_a1b2c3d4",
      status: "pending",
      deal_type: "consortium",
      completed_method: null,
      expires_at: new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString(),
      failure_reason: null,
      customer: {
        id: 1,
        name: "Carlos Eduardo Silva",
        cpf: "12345678900",
        phone: "(86) 99812-3456",
        email: "carlos.silva@email.com",
        contact_id: "contact_001",
      },
      order: {
        id: 1,
        order_number: "PED-20240315-001",
        description: "Honda CG 160 Titan - 0km",
        model: "CG 160 Titan",
        color: "Vermelho Racing",
        year: "2024/2025",
        installments: 12,
        amount: 15490.00,
        notes: "Cliente preferencial - primeira compra",
      },
    };

    this.sessions.set(mockSession.session_id, mockSession);
    this.sessions.set("demo", { ...mockSession, session_id: "demo" });

    const pixOnlySession: CheckoutSession = {
      ...mockSession,
      session_id: "demo-pix",
      deal_type: "financing",
      order: { ...mockSession.order, installments: 1 },
    };
    this.sessions.set("demo-pix", pixOnlySession);
  }

  private checkExpiration(session: CheckoutSession): CheckoutSession {
    if (session.status === "approved" || session.status === "cancelled") return session;
    // Expiration logic disabled for local testing
    // const expiresAt = new Date(session.expires_at).getTime();
    // if (Date.now() > expiresAt) {
    //   session.status = "expired";
    // }
    return session;
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    return { ...this.checkExpiration(session) };
  }

  async verifyCpf(sessionId: string, cpf: string): Promise<{ valid: boolean; message?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, message: "Sessão não encontrada." };
    }

    const normalizedInput = cpf.replace(/\D/g, "");
    const normalizedStored = session.customer.cpf.replace(/\D/g, "");

    if (normalizedInput !== normalizedStored) {
      return { valid: false, message: "CPF não corresponde ao cadastro desta compra." };
    }

    return { valid: true };
  }

  async validateSession(sessionId: string): Promise<{ valid: boolean; session?: CheckoutSession; reason?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, reason: "not_found" };
    }

    this.checkExpiration(session);

    if (session.status === "approved") {
      return { valid: false, session: { ...session }, reason: "approved" };
    }
    if (session.status === "expired") {
      return { valid: false, session: { ...session }, reason: "expired" };
    }
    if (session.status === "cancelled") {
      return { valid: false, session: { ...session }, reason: "cancelled" };
    }

    return { valid: true, session: { ...session } };
  }

  async processPayment(sessionId: string, method: string, _data: unknown): Promise<PaymentResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: "Sessão não encontrada." };
    }

    this.checkExpiration(session);

    if (session.status === "approved") {
      return { success: false, message: "Este pagamento já foi confirmado." };
    }
    if (session.status === "expired") {
      return { success: false, message: "Esta sessão expirou. Solicite um novo link." };
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (method === "pix") {
      return {
        success: true,
        transaction_id: `TXN-PIX-${Date.now()}`,
        pix_code: "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540515490.005802BR5925MOTOPEMA MOTOS LTDA6009SAO PAULO62070503***6304ABCD",
        pix_qr_code: "qr-placeholder",
        message: "PIX gerado com sucesso. Aguardando pagamento.",
      };
    }

    const cardNumber = (_data as Record<string, string>)?.cardNumber;
    const simulateFailure = cardNumber?.replace(/\s/g, "").endsWith("0000");

    if (simulateFailure) {
      session.status = "failed";
      session.failure_reason = "Cartão recusado pela operadora. Verifique os dados e tente novamente.";
      return { success: false, message: session.failure_reason };
    }

    // Map internal method name to CompletedMethod format
    const completedMethodMap: Record<string, CheckoutSession["completed_method"]> = {
      credit: "credit_card",
      debit: "debit_card",
      pix: "pix",
    };

    session.status = "approved";
    session.completed_method = completedMethodMap[method] ?? "pix";

    return {
      success: true,
      transaction_id: `TXN-${method.toUpperCase()}-${Date.now()}`,
      message: "Pagamento aprovado com sucesso!",
    };
  }

  async cancelSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: "Sessão não encontrada." };
    }
    if (session.status === "approved") {
      return { success: false, message: "Sessão já concluída, não pode ser cancelada." };
    }
    if (session.status === "cancelled") {
      return { success: false, message: "Sessão já cancelada." };
    }
    session.status = "cancelled";
    return { success: true };
  }
}

// ─── Storage factory ──────────────────────────────────────────────────────────
// When BACKEND_URL is set, all API calls go to the real Python backend.
// Otherwise, the in-memory mock is used for local development.

function createStorage(): IStorage {
  if (process.env.BACKEND_URL) {
    const { BackendStorage } = require("./backendStorage") as typeof import("./backendStorage");
    return new BackendStorage();
  }
  return new MemStorage();
}

const globalForStorage = globalThis as unknown as { _storage: IStorage };
export const storage: IStorage = globalForStorage._storage || createStorage();
if (process.env.NODE_ENV !== "production") globalForStorage._storage = storage;
