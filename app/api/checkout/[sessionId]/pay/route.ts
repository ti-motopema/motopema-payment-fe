import { NextRequest, NextResponse } from "next/server";
import { payCheckoutSession } from "@/lib/backend/checkout";
import { proxyBackendJsonResponse } from "@/lib/backend/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const response = await payCheckoutSession(sessionId, body);
    return proxyBackendJsonResponse(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao processar pagamento no backend.",
        message: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}
