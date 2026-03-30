import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

/** Extracts the real client IP from common proxy/load-balancer headers. */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const validation = await storage.validateSession(sessionId);

    if (!validation.valid && validation.reason !== "not_found") {
      const session = validation.session;
      if (validation.reason === "approved") {
        return NextResponse.json(
          { error: "Este pagamento já foi confirmado.", reason: "approved", session },
          { status: 403 }
        );
      }
      if (validation.reason === "expired") {
        return NextResponse.json(
          { error: "Esta sessão expirou.", reason: "expired", session },
          { status: 403 }
        );
      }
      if (validation.reason === "cancelled") {
        return NextResponse.json(
          { error: "Esta sessão foi cancelada.", reason: "cancelled", session },
          { status: 403 }
        );
      }
    }

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Sessão não encontrada.", reason: "not_found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { method, ...paymentData } = body;

    if (!method) {
      return NextResponse.json(
        { error: "Método de pagamento não informado." },
        { status: 400 }
      );
    }

    // Enrich with server-side context before forwarding to storage/backend
    const enrichedData = {
      ...paymentData,
      amount: validation.session?.order.amount,
      customerEmail: validation.session?.customer.email,
      customerPhone: validation.session?.customer.phone,
      _clientIp: getClientIp(req),
    };

    const result = await storage.processPayment(sessionId, method, enrichedData);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar pagamento." },
      { status: 500 }
    );
  }
}
