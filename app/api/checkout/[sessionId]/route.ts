import { NextRequest, NextResponse } from "next/server";
import { sessionsApi } from "@/lib/backendClient";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    // const session = await storage.getCheckoutSession(sessionId);
    const session = await sessionsApi.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada.", reason: "not_found" },
        { status: 404 }
      );
    }
    return NextResponse.json(session.data);  // TODO: Buscar esse data do axios em outro local
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
