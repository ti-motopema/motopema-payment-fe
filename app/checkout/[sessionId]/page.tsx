"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CheckoutSession, PaymentMethod, CreditCardFormData, DebitCardFormData, PaymentResult } from "@/shared/schema";

import Header from "@/components/checkout/Header";
import CustomerInfoCard from "@/components/checkout/CustomerInfoCard";
import OrderSummaryCard from "@/components/checkout/OrderSummaryCard";
import PriceSummary from "@/components/checkout/PriceSummary";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import CreditCardForm from "@/components/checkout/CreditCardForm";
import DebitCardForm from "@/components/checkout/DebitCardForm";
import PixPaymentPanel from "@/components/checkout/PixPaymentPanel";
import SuccessState from "@/components/checkout/SuccessState";
import ErrorState from "@/components/checkout/ErrorState";
import ExpiredState from "@/components/checkout/ExpiredState";
import PaymentFailedState from "@/components/checkout/PaymentFailedState";
import CpfVerification from "@/components/checkout/CpfVerification";
import LoadingSkeleton from "@/components/checkout/LoadingSkeleton";
import SecurityFooter from "@/components/checkout/SecurityFooter";

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
    queryKey: ["/api/checkout", sessionId],
  });

  const handleRetry = useCallback(() => {
    setPaymentFailed(false);
    setFailureMessage("");
    setPaymentResult(null);
    setPixGenerated(false);
    queryClient.invalidateQueries({ queryKey: ["/api/checkout", sessionId] });
  }, [sessionId]);

  const handlePaymentResponse = useCallback(async (result: Response, method: string) => {
    const json: PaymentResult = await result.json();

    if (!json.success) {
      setPaymentFailed(true);
      setFailureMessage(json.message || "Pagamento recusado.");
      return;
    }

    setPaymentResult(json);

    if (method === "pix") {
      setPixGenerated(true);
    }

    queryClient.invalidateQueries({ queryKey: ["/api/checkout", sessionId] });
  }, [sessionId]);

  const handleCreditSubmit = async (data: CreditCardFormData) => {
    setIsProcessing(true);
    try {
      const result = await apiRequest("POST", `/api/checkout/${sessionId}/pay`, {
        method: "credit",
        ...data,
      });
      await handlePaymentResponse(result, "credit");
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes("403")) {
        queryClient.invalidateQueries({ queryKey: ["/api/checkout", sessionId] });
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
      const result = await apiRequest("POST", `/api/checkout/${sessionId}/pay`, {
        method: "debit",
        ...data,
      });
      await handlePaymentResponse(result, "debit");
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes("403")) {
        queryClient.invalidateQueries({ queryKey: ["/api/checkout", sessionId] });
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
      const result = await apiRequest("POST", `/api/checkout/${sessionId}/pay`, {
        method: "pix",
      });
      await handlePaymentResponse(result, "pix");
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes("403")) {
        queryClient.invalidateQueries({ queryKey: ["/api/checkout", sessionId] });
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

  if (!cpfVerified && session.status === "active") {
    return (
      <CpfVerification
        sessionId={sessionId}
        customerName={session.customer.name}
        maskedCpf={session.customer.cpf}
        onVerified={() => setCpfVerified(true)}
      />
    );
  }

  if (session.status === "completed") {
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

  if (session.status === "expired") {
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
        <PaymentFailedState
          message={failureMessage}
          onRetry={handleRetry}
        />
        <SecurityFooter />
      </div>
    );
  }

  if (paymentResult?.success && !pixGenerated) {
    const effectiveMethodsForSuccess: PaymentMethod[] =
      session.paymentType === "consorcio"
        ? session.availablePaymentMethods
        : ["pix"];
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
    session.paymentType === "consorcio"
      ? session.availablePaymentMethods
      : ["pix"];

  const activeMethod: PaymentMethod =
    selectedMethod && effectiveMethods.includes(selectedMethod)
      ? selectedMethod
      : effectiveMethods[0];

  return (
    <div className="min-h-screen bg-background" data-testid="checkout-page">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {timeRemainingMin <= 5 && timeRemainingMin > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200" data-testid="warning-expiration">
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
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
                  onSelect={(m) => {
                    setSelectedMethod(m);
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
                    <DebitCardForm
                      onSubmit={handleDebitSubmit}
                      isProcessing={isProcessing}
                    />
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
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>
                    Seus dados são transmitidos com criptografia e não são armazenados em nossos servidores.
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
