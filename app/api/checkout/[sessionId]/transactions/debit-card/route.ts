import { NextRequest, NextResponse } from "next/server";
import { fetchCheckoutSession } from "@/lib/backend/checkout";
import { debitCardTransaction } from "@/lib/backend/checkout";
import { getPaymentProviderThreeDSBillingDefaults } from "@/lib/backend/config";
import {
  getCheckoutVerificationCookieName,
  hasValidCheckoutVerificationCookieValue,
} from "@/lib/checkout-verification";
import { proxyBackendJsonResponse } from "@/lib/backend/http";

type DebitCardTransactionBody = {
  amount: number;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  threeDSecure: {
    device: {
      colorDepth: number;
      deviceType3ds: string;
      javaEnabled: boolean;
      language: string;
      screenHeight: number;
      screenWidth: number;
      timeZoneOffset: number;
    };
  };
};

type CheckoutSessionPayload = {
  customer: {
    email: string;
    phone: string;
  };
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const cookieValue = req.cookies.get(getCheckoutVerificationCookieName(sessionId))?.value;
    const isVerified = hasValidCheckoutVerificationCookieValue(sessionId, cookieValue);

    if (!isVerified) {
      return NextResponse.json(
        {
          error: "CPF nao verificado.",
          message: "Confirme seu CPF antes de continuar com o pagamento.",
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as DebitCardTransactionBody;
    const cookieHeader = req.headers.get("cookie") || undefined;
    const sessionResponse = await fetchCheckoutSession(sessionId);

    if (!sessionResponse.ok) {
      throw new Error("Nao foi possivel consultar a sessao para montar o payload de debito.");
    }

    const session = (await sessionResponse.json()) as CheckoutSessionPayload;
    const billingDefaults = getPaymentProviderThreeDSBillingDefaults();

    const response = await debitCardTransaction(sessionId, {
      amount: body.amount,
      cardholderName: body.cardholderName,
      cardNumber: body.cardNumber.replace(/\s+/g, ""),
      expiryDate: body.expiryDate,
      cvv: body.cvv,
      distributorAffiliation: process.env.PAYMENT_PROVIDER_CLIENT_ID,
      threeDSecure: {
        userAgent: req.headers.get("user-agent") || "Mozilla/5.0",
        ipAddress: "192.168.0.1",
        device: body.threeDSecure.device,
        billing: {
          ...billingDefaults,
          emailAddress: session.customer.email,
          phoneNumber: session.customer.phone.replace(/\D/g, ""),
        },
      },
    }, cookieHeader);

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
