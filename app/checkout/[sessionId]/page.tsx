"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { maskCpf } from "@/lib/formatters";
import type { BrowserData, CheckoutSession, PaymentMethod, CreditCardFormData, DebitCardFormData, PaymentResult } from "@/shared/schema";
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
import CancelledState from "@/components/checkout/CancelledState";
import PaymentFailedState from "@/components/checkout/PaymentFailedState";
import CpfVerification from "@/components/checkout/CpfVerification";
import LoadingSkeleton from "@/components/checkout/LoadingSkeleton";
import SecurityFooter from "@/components/checkout/SecurityFooter";

/** Collects 3-D Secure browser fingerprint data from the current window. */
function collectBrowserData(): BrowserData {
  return {
    userAgent: navigator.userAgent,
    colorDepth: screen.colorDepth,
    javaEnabled: false,
    language: navigator.language,
    screenHeight: screen.height,
    screenWidth: screen.width,
    timeZoneOffset: new Date().getTimezoneOffset(),
  };
}

export default function CheckoutPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { toast } = useToast();

  const [cpfVerified, setCpfVerified] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
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

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await apiRequest("POST", `/api/checkout/${sessionId}/cancel`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/checkout", sessionId] });
    } catch {
      toast({ title: "Erro ao cancelar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

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
      // await handlePaymentResponse(result, "credit");
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
        browserData: collectBrowserData(),
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
      console.log("Pix generation response:", result);
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

  if (!cpfVerified && (session.status === "pending" || session.status === "processing")) {
    return (
      <CpfVerification
        sessionId={sessionId}
        customerName={session.customer.name}
        maskedCpf={maskCpf(session.customer.cpf)}
        onVerified={() => setCpfVerified(true)}
      />
    );
  }

  if (session.status === "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SuccessState
          amount={session.order?.amount}
          method={session.completed_method || "pix"}
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

  if (session.status === "cancelled") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <CancelledState />
        <SecurityFooter />
      </div>
    );
  }

  if (session.status === "failed") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PaymentFailedState
          message={session.failure_reason || "Pagamento recusado pela operadora."}
          onRetry={handleRetry}
        />
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
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SuccessState
          transaction_id={paymentResult.transaction_id}
          amount={session.order?.amount}
          method={selectedMethod || "pix"}
        />
        <SecurityFooter />
      </div>
    );
  }

  const expiresAt = new Date(session.expires_at).getTime();
  const timeRemainingMs = Math.max(0, expiresAt - Date.now());
  const timeRemainingMin = Math.ceil(timeRemainingMs / 60000);

  const effectiveMethods: PaymentMethod[] =
    session.deal_type === "consortium"
      ? ["credit", "debit", "pix"]
      : ["credit", "debit", "pix"];

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
            <OrderSummaryCard order={session.order} dealType={session.deal_type} />
            <PriceSummary order={session.order} />
          </div>

          <div className="lg:col-span-7 space-y-4">
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
                      amount={session.order?.amount}
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
                      amount={session.order?.amount}
                      onGeneratePix={handlePixGenerate}
                      isProcessing={isProcessing}
                      pix_code={paymentResult?.pix_code}
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
                    Seus dados são transmitidos com criptografia e não são armazenados em nossos servidores.
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center" data-testid="cancel-section">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCancelling || isProcessing}
                    data-testid="button-cancel-session"
                  >
                    {isCancelling ? "Cancelando..." : "Cancelar este pagamento"}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar pagamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao confirmar, este link de pagamento será <strong>inativado permanentemente</strong>. Você precisará solicitar um novo link ao seu consultor Motopema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-dialog-back">
                      Não, voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-cancel-dialog-confirm"
                    >
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </main>

      <SecurityFooter />
    </div>
  );
}
