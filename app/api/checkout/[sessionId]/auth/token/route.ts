import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
} from "@/lib/backend/checkout";
import { proxyBackendJsonResponse } from "@/lib/backend/http";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const response = await getAccessToken({
      sessionId,
    });

    return proxyBackendJsonResponse(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao consultar sessao no backend.",
        message: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}
