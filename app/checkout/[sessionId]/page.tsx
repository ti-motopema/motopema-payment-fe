"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getAxiosStatus, getCheckoutSession, payCheckoutSession } from "@/lib/checkout-api";
import { queryClient } from "@/lib/queryClient";
import type {
  CheckoutSession,
  CreditCardFormData,
  DebitCardFormData,
  PaymentMethod,
  PaymentResult,
} from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import CpfVerification from "@/components/checkout/CpfVerification";
import CreditCardForm from "@/components/checkout/CreditCardForm";
import CustomerInfoCard from "@/components/checkout/CustomerInfoCard";
import DebitCardForm from "@/components/checkout/DebitCardForm";
import ErrorState from "@/components/checkout/ErrorState";
import ExpiredState from "@/components/checkout/ExpiredState";
import Header from "@/components/checkout/Header";
import LoadingSkeleton from "@/components/checkout/LoadingSkeleton";
import OrderSummaryCard from "@/components/checkout/OrderSummaryCard";
import PaymentFailedState from "@/components/checkout/PaymentFailedState";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import PixPaymentPanel from "@/components/checkout/PixPaymentPanel";
import PriceSummary from "@/components/checkout/PriceSummary";
import SecurityFooter from "@/components/checkout/SecurityFooter";
import SuccessState from "@/components/checkout/SuccessState";

export default function CheckoutPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "demo";
  const { toast } = useToast();

  const [cpfVerified, setCpfVerified] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");

  const { data: session, isLoading, error } = useQuery<CheckoutSession>({
    queryKey: ["checkout", sessionId],
    queryFn: () => getCheckoutSession(sessionId),
  });

  const isPending = session?.status === "pending";
  const isPaid = session?.status === "paid";
  const isExpired = session?.status === "expired";
  const isCancelled = session?.status === "cancelled";

  console.log("Session data:", session, "Loading:", isLoading, "Error:", error);

  const invalidateSession = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["checkout", sessionId] });
  }, [sessionId]);

  const handleRetry = useCallback(() => {
    setPaymentFailed(false);
    setFailureMessage("");
    setPaymentResult(null);
    setPixGenerated(false);
    invalidateSession();
  }, [invalidateSession]);

  const handlePaymentResponse = useCallback((result: PaymentResult, method: string) => {
    if (!result.success) {
      setPaymentFailed(true);
      setFailureMessage(result.message || "Pagamento recusado.");
      return;
    }

    setPaymentResult(result);

    if (method === "pix") {
      setPixGenerated(true);
    }

    invalidateSession();
  }, [invalidateSession]);

  const handleCreditSubmit = async (data: CreditCardFormData) => {
    setIsProcessing(true);
    try {
      const result = await payCheckoutSession(sessionId, {
        method: "credit",
        ...data,
      });
      handlePaymentResponse(result, "credit");
    } catch (error: unknown) {
      if (getAxiosStatus(error) === 403) {
        invalidateSession();
      } else {
        toast({ title: "Erro ao processar pagamento", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDebitSubmit = async (data: DebitCardFormData) => {
    setIsProcessing(true);
    try {
      const result = await payCheckoutSession(sessionId, {
        method: "debit",
        ...data,
      });
      handlePaymentResponse(result, "debit");
    } catch (error: unknown) {
      if (getAxiosStatus(error) === 403) {
        invalidateSession();
      } else {
        toast({ title: "Erro ao processar pagamento", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePixGenerate = async () => {
    setIsProcessing(true);
    try {
      const result = await payCheckoutSession(sessionId, { method: "pix" });
      handlePaymentResponse(result, "pix");
    } catch (error: unknown) {
      if (getAxiosStatus(error) === 403) {
        invalidateSession();
      } else {
        toast({ title: "Erro ao gerar PIX", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ErrorState />
        <SecurityFooter />
      </div>
    );
  }

  if (!cpfVerified && isPending) {
    return (
      <CpfVerification
        sessionId={sessionId}
        customerName={session.customer.name}
        maskedCpf={session.customer.cpf}
        onVerified={() => setCpfVerified(true)}
      />
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SuccessState
          transactionId={session.transactionId}
          total={session.pricing.total}
          method={session.completedMethod || "credit"}
        />
        <SecurityFooter />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ExpiredState />
        <SecurityFooter />
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PaymentFailedState message={failureMessage} onRetry={handleRetry} />
        <SecurityFooter />
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PaymentFailedState
          message={session.failureMessage || "Este pagamento foi cancelado."}
          onRetry={handleRetry}
        />
        <SecurityFooter />
      </div>
    );
  }

  if (paymentResult?.success && !pixGenerated) {
    const effectiveMethodsForSuccess: PaymentMethod[] =
      session.paymentType === "consorcio" ? session.availablePaymentMethods : ["pix"];

    const resolvedMethod: PaymentMethod =
      selectedMethod && effectiveMethodsForSuccess.includes(selectedMethod)
        ? selectedMethod
        : effectiveMethodsForSuccess[0];

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SuccessState
          transactionId={paymentResult.transactionId}
          total={session.pricing.total}
          method={resolvedMethod}
        />
        <SecurityFooter />
      </div>
    );
  }

  const createdAt = new Date(session.createdAt).getTime();
  const expiresAt = createdAt + 15 * 60 * 1000;
  const timeRemainingMs = Math.max(0, expiresAt - Date.now());
  const timeRemainingMin = Math.ceil(timeRemainingMs / 60000);

  const effectiveMethods: PaymentMethod[] =
    session.paymentType === "consorcio" ? session.availablePaymentMethods : ["pix"];

  const activeMethod: PaymentMethod =
    selectedMethod && effectiveMethods.includes(selectedMethod)
      ? selectedMethod
      : effectiveMethods[0];

  return (
    <div className="min-h-screen bg-background" data-testid="checkout-page">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {timeRemainingMin <= 5 && timeRemainingMin > 0 && (
          <div
            className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200"
            data-testid="warning-expiration"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Este link expira em <strong>{timeRemainingMin} minuto{timeRemainingMin > 1 ? "s" : ""}</strong>. Finalize seu pagamento.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-5 space-y-4">
            <CustomerInfoCard customer={session.customer} />
            <OrderSummaryCard order={session.order} />
            <PriceSummary pricing={session.pricing} />
          </div>

          <div className="lg:col-span-7">
            <Card data-testid="card-payment">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <PaymentMethodSelector
                  methods={effectiveMethods}
                  selected={activeMethod}
                  onSelect={(method) => {
                    setSelectedMethod(method);
                    setPixGenerated(false);
                    setPaymentResult(null);
                  }}
                />

                <div className="border-t pt-5">
                  {activeMethod === "credit" && (
                    <CreditCardForm
                      installmentOptions={session.installmentOptions}
                      onSubmit={handleCreditSubmit}
                      isProcessing={isProcessing}
                    />
                  )}

                  {activeMethod === "debit" && (
                    <DebitCardForm onSubmit={handleDebitSubmit} isProcessing={isProcessing} />
                  )}

                  {activeMethod === "pix" && (
                    <PixPaymentPanel
                      total={session.pricing.total}
                      onGeneratePix={handlePixGenerate}
                      isProcessing={isProcessing}
                      pixCode={paymentResult?.pixCode}
                      pixGenerated={pixGenerated}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>
                    Seus dados sao transmitidos com criptografia e nao sao armazenados em nossos servidores.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SecurityFooter />
    </div>
  );
}
