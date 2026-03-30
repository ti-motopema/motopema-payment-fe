import { NextRequest, NextResponse } from "next/server";
import {
  authApi,
  sessionsApi,
  transactionsApi,
  withRetry,
  PROVIDER_CARD,
  PROVIDER_PIX,
  type ThreeDSecureData,
} from "@/lib/backendClient";
import type { PaymentMethod } from "@/shared/schema";

const DISTRIBUTOR_AFFILIATION = parseInt(
  process.env.BACKEND_DISTRIBUTOR_AFFILIATION ?? "0",
  10
);

type SessionStatus = "pending" | "processing" | "approved" | "failed" | "expired" | "cancelled";

interface SessionForPayment {
  session_id: string;
  status: SessionStatus;
  failure_reason: string | null;
  customer: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  order: {
    order_number: string;
  };
}

interface BrowserDataInput {
  userAgent: string;
  colorDepth: number;
  javaEnabled: boolean;
  language: string;
  screenHeight: number;
  screenWidth: number;
  timeZoneOffset: number;
}

interface PaymentRequestBody {
  method: PaymentMethod;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  installments?: number;
  browserData?: BrowserDataInput;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function extractMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Erro ao processar pagamento.";
  const marker = ": ";
  const idx = err.message.lastIndexOf(marker);
  return idx >= 0 ? err.message.slice(idx + marker.length) : err.message;
}

function normalizeSession(raw: unknown): SessionForPayment | null {
  const payload = (raw as { data?: unknown } | undefined)?.data ?? raw;
  if (!payload || typeof payload !== "object") return null;

  const p = payload as Record<string, unknown>;

  // Flat response: { session_id, status, customer, order, ... }
  if (p.session_id && p.status && p.customer && p.order) {
    return p as unknown as SessionForPayment;
  }

  // Nested response: { session, customer, order }
  if (p.session && p.customer && p.order) {
    const session = p.session as Record<string, unknown>;
    return {
      session_id: String(session.session_id ?? ""),
      status: String(session.status ?? "pending") as SessionStatus,
      failure_reason: (session.failure_reason as string | null) ?? null,
      customer: p.customer as SessionForPayment["customer"],
      order: p.order as SessionForPayment["order"],
    };
  }

  return null;
}

function buildThreeDSecure(req: NextRequest, session: SessionForPayment, browser?: BrowserDataInput): ThreeDSecureData {
  return {
    userAgent: browser?.userAgent ?? "",
    ipAddress: getClientIp(req),
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
      emailAddress: session.customer.email ?? "",
      phoneNumber: normalizePhone(session.customer.phone ?? ""),
    },
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionResponse = await sessionsApi.get<unknown>(sessionId);
    const session = normalizeSession(sessionResponse);

    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada.", reason: "not_found" },
        { status: 404 }
      );
    }

    if (session.status === "approved") {
      return NextResponse.json(
        { error: "Este pagamento já foi confirmado.", reason: "approved", session },
        { status: 403 }
      );
    }
    if (session.status === "expired") {
      return NextResponse.json(
        { error: "Esta sessão expirou.", reason: "expired", session },
        { status: 403 }
      );
    }
    if (session.status === "cancelled") {
      return NextResponse.json(
        { error: "Esta sessão foi cancelada.", reason: "cancelled", session },
        { status: 403 }
      );
    }

    const body = (await req.json()) as PaymentRequestBody;
    const { method } = body;

    if (!method) {
      return NextResponse.json(
        { error: "Método de pagamento não informado." },
        { status: 400 }
      );
    }

    if (method === "credit") {
      await withRetry(() => authApi.token(sessionId, PROVIDER_CARD));

      const response = await withRetry(() =>
        transactionsApi.creditCard(sessionId, {
          cardholderName: body.cardholderName ?? "",
          cardNumber: (body.cardNumber ?? "").replace(/\s/g, ""),
          expiryDate: body.expiryDate ?? "",
          cvv: body.cvv ?? "",
          installments: body.installments ?? 1,
          distributorAffiliation: DISTRIBUTOR_AFFILIATION,
        })
      );

      const res = response as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        transaction_id: String(res.transaction_id ?? res.id ?? ""),
        message: "Pagamento aprovado com sucesso!",
      });
    }

    if (method === "debit") {
      await withRetry(() => authApi.token(sessionId, PROVIDER_CARD));

      const response = await withRetry(() =>
        transactionsApi.debitCard(sessionId, {
          cardholderName: body.cardholderName ?? "",
          cardNumber: (body.cardNumber ?? "").replace(/\s/g, ""),
          expiryDate: body.expiryDate ?? "",
          cvv: body.cvv ?? "",
          distributorAffiliation: DISTRIBUTOR_AFFILIATION,
          threeDSecure: buildThreeDSecure(req, session, body.browserData),
        })
      );

      const res = response as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        transaction_id: String(res.transaction_id ?? res.id ?? ""),
        message: "Pagamento aprovado com sucesso!",
      });
    }

    if (method === "pix") {
      // await withRetry(() => authApi.token(sessionId, PROVIDER_PIX));

      // console.log("Generating PIX for session:", sessionId, "customer:", {
      //     cpf: normalizeCpf(session.customer.cpf),
      //     name: session.customer.name,
      //     payer_request: `Pagamento pedido ${session.order.order_number}`,
      //     expiration: 1200,
      //   });

      // const response = await withRetry(() =>
      //   transactionsApi.pix(sessionId, {
      //     cpf: normalizeCpf(session.customer.cpf),
      //     name: session.customer.name,
      //     payer_request: `Pagamento pedido ${session.order.order_number}`,
      //     expiration: 1200,
      //   })
      // );

      const response = await transactionsApi.pix(sessionId, {
        cpf: normalizeCpf(session.customer.cpf),
        name: session.customer.name,
        payer_request: `Pagamento pedido ${session.order.order_number}`,
        expiration: 1200,
      });

      console.log("Response for PIX generation:", response);

      const res = response as Record<string, unknown>;
      return NextResponse.json({ 
        success: true,
        transaction_id: String(res.transaction_id ?? res.id ?? ""),
        pix_code: String(res.pix_code ?? res.code ?? res.emv ?? ""),
        pix_qr_code: String(res.pix_qr_code ?? res.qr_code ?? res.qrCode ?? ""),
        message: "PIX gerado com sucesso. Aguardando pagamento.",
      });
    }

    return NextResponse.json(
      { success: false, message: `Método de pagamento desconhecido: ${method}` },
      { status: 200 }
    );
  } catch (err) {
    const status = (err as { status?: number }).status;
    const message = extractMessage(err);

    if (status !== undefined && status >= 400 && status < 500) {
      return NextResponse.json(
        { success: false, message },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao processar pagamento." },
      { status: 500 }
    );
  }
}
