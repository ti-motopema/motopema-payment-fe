import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/backendClient";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { cpf } = body;

    if (!cpf) {
      return NextResponse.json(
        { valid: false, message: "CPF não informado." },
        { status: 400 }
      );
    }

    // const result = await storage.verifyCpf(sessionId, cpf);
    const result = await authApi.verify(sessionId, cpf);
    // @ts-ignore - // TODO: Corrigir tipo de resposta da API
    if (!result.valid) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
