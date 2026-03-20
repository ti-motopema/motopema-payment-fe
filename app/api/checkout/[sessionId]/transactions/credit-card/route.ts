import { NextRequest, NextResponse } from "next/server";
import { creditCardTransaction } from "@/lib/backend/checkout";
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

    const body = (await req.json()) as CreditCardTransactionBody;
    const cookieHeader = req.headers.get("cookie") || undefined;

    console.log("Received credit card transaction request:", {
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
      distributorAffiliation: process.env.PAYMENT_PROVIDER_CLIENT_ID,
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
