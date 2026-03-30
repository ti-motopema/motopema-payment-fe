import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const result = await storage.cancelSession(sessionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message ?? "Não foi possível cancelar a sessão." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao cancelar a sessão." },
      { status: 500 }
    );
  }
}
