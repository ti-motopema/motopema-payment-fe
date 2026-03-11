import { NextRequest, NextResponse } from "next/server";
import { verifyCheckoutCpf } from "@/lib/backend/checkout";
import { proxyBackendJsonResponse } from "@/lib/backend/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const response = await verifyCheckoutCpf(sessionId, body);
    return proxyBackendJsonResponse(response);
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        message: error instanceof Error ? error.message : "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}
