import { NextRequest, NextResponse } from "next/server";
import { creditCardTransaction } from "@/lib/backend/checkout";
import {
  getCheckoutVerificationCookieName,
  hasValidCheckoutVerificationCookieValue,
} from "@/lib/checkout-verification";
import { proxyBackendJsonResponse } from "@/lib/backend/http";

type CreditCardTransactionBody = {
  amount: number;
  installments: number;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
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

    const body = (await req.json()) as CreditCardTransactionBody;
    const cookieHeader = req.headers.get("cookie") || undefined;

    // {
    //   "cardholderName": "string",
    //   "cardNumber": "stringstrings",
    //   "expiryDate": "11/31",
    //   "cvv": "stri",
    //   "installments": 1,
    //   "amount": 1,
    //   "distributorAffiliation": 0
    // }

    console.log("Request body:", {
      amount: body.amount,
      installments: body.installments,
      cardholderName: body.cardholderName,
      cardNumber: body.cardNumber.replace(/\s+/g, ""),
      expiryDate: body.expiryDate,
      cvv: body.cvv,
      distributorAffiliation: process.env.PAYMENT_PROVIDER_CLIENT_ID,
    });

    const response = await creditCardTransaction(sessionId, {
      amount: body.amount,
      installments: body.installments,
      cardholderName: body.cardholderName,
      cardNumber: body.cardNumber.replace(/\s+/g, ""),
      expiryDate: body.expiryDate,
      cvv: body.cvv,
      distributorAffiliation: process.env.PAYMENT_PROVIDER_CLIENT_ID, // Adiciona a afiliação do distribuidor se estiver disponível
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
