import { NextRequest, NextResponse } from "next/server";
import { verifyCheckoutCpf } from "@/lib/backend/checkout";
import { proxyBackendJsonResponse } from "@/lib/backend/http";
import {
  createSignedCheckoutVerificationCookieValue,
  getCheckoutVerificationCookieName,
  getCheckoutVerificationRemainingMaxAge,
} from "@/lib/checkout-verification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = (await req.json()) as { cpf: string; expiresAt?: string };
    const response = await verifyCheckoutCpf(sessionId, { cpf: body.cpf });
    const nextResponse = await proxyBackendJsonResponse(response);

    if (!response.ok) {
      return nextResponse;
    }

    if (body.expiresAt) {
      const maxAge = getCheckoutVerificationRemainingMaxAge(body.expiresAt);

      if (maxAge > 0) {
        const signedValue = createSignedCheckoutVerificationCookieValue({
          sessionId,
          verifiedAt: Date.now(),
          expiresAt: body.expiresAt,
        });

        nextResponse.cookies.set(getCheckoutVerificationCookieName(sessionId), signedValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge,
          path: "/",
        });
      }
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}
