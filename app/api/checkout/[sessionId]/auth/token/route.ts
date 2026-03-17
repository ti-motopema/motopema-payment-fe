import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
} from "@/lib/backend/checkout";
import { getPaymentProviderCredentials } from "@/lib/backend/config";
import { proxyBackendJsonResponse } from "@/lib/backend/http";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { clientId, clientSecret } = getPaymentProviderCredentials();
    const response = await getAccessToken({
      sessionId,
      client_id: clientId,
      client_secret: clientSecret,
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
