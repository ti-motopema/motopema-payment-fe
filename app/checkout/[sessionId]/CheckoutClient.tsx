"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createCreditCardTransaction,
  createDebitCardTransaction,
  fetchCheckoutSession,
  getAxiosStatus,
  requestPaymentProviderAccessToken,
} from "@/lib/checkout-api";
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
import ThreeDSecureRedirectState from "@/components/checkout/ThreeDSecureRedirectState";

interface CheckoutClientProps {
  sessionId: string;
  initialCpfVerified: boolean;
}

interface TransactionState {
  failureMessage: string;
  paymentFailed: boolean;
  paymentResult: PaymentResult | null;
  pixGenerated: boolean;
  threeDSecureEmbedded: boolean;
  threeDSecureUrl: string | null;
}

type CheckoutSessionResponse = CheckoutSession | { data: CheckoutSession };

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = ["debit", "credit", "pix"];
const INITIAL_TRANSACTION_STATE: TransactionState = {
  failureMessage: "",
  paymentFailed: false,
  paymentResult: null,
  pixGenerated: false,
  threeDSecureEmbedded: false,
  threeDSecureUrl: null,
};

function getThreeDSecureDevice() {
  const screen = window.screen;
  const navigator = window.navigator as Navigator & { javaEnabled?: () => boolean };

  return {
    colorDepth: screen.colorDepth || 24,
    deviceType3ds: "browser",
    javaEnabled: typeof navigator.javaEnabled === "function" ? navigator.javaEnabled() : false,
    language: navigator.language || "pt-BR",
    screenHeight: screen.height || 0,
    screenWidth: screen.width || 0,
    timeZoneOffset: new Date().getTimezoneOffset(),
  };
}

function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {children}
      <SecurityFooter />
    </div>
  );
}

export default function CheckoutClient({ sessionId, initialCpfVerified }: CheckoutClientProps) {
  const { toast } = useToast();

  const [cpfVerified, setCpfVerified] = useState(initialCpfVerified);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHODS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionState, setTransactionState] = useState<TransactionState>(INITIAL_TRANSACTION_STATE);

  const { data: sessionData, isLoading, error } = useQuery<CheckoutSessionResponse>({
    queryKey: ["checkout", sessionId],
    queryFn: () => fetchCheckoutSession({ sessionId }),
  });

  const session = sessionData && "data" in sessionData ? sessionData.data : sessionData;
  const availableMethods =
    session?.availablePaymentMethods?.length ? session.availablePaymentMethods : DEFAULT_PAYMENT_METHODS;

  const isPending = session?.status === "pending";

  const {
    data: tokenRequest,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useQuery({
    queryKey: ["payment-provider-access-token", sessionId],
    queryFn: () => requestPaymentProviderAccessToken({ sessionId }),
    enabled: cpfVerified && isPending,
    retry: false,
  });

  const isPaid = session?.status === "paid";
  const isExpired = session?.status === "expired";
  const isCancelled = session?.status === "cancelled";
  const hasPaymentProviderAccess = selectedMethod === "pix" || tokenRequest?.success === true;

  const {
    failureMessage,
    paymentFailed,
    paymentResult,
    pixGenerated,
    threeDSecureEmbedded,
    threeDSecureUrl,
  } = transactionState;

  useEffect(() => {
    if (!availableMethods.includes(selectedMethod)) {
      setSelectedMethod(availableMethods[0] ?? DEFAULT_PAYMENT_METHODS[0]);
    }
  }, [availableMethods, selectedMethod]);

  function invalidateSession() {
    queryClient.invalidateQueries({ queryKey: ["checkout", sessionId] });
  }

  function resetTransactionState() {
    setTransactionState(INITIAL_TRANSACTION_STATE);
  }

  function handleRetry() {
    resetTransactionState();
    invalidateSession();
    queryClient.invalidateQueries({ queryKey: ["payment-provider-access-token", sessionId] });
  }

  function handlePaymentResponse(result: PaymentResult, method: PaymentMethod) {
    if (method === "debit" && result.returnCode === "220" && result.threeDSecure?.url) {
      setTransactionState({
        ...INITIAL_TRANSACTION_STATE,
        paymentResult: result,
        threeDSecureEmbedded: result.threeDSecure.embedded === true,
        threeDSecureUrl: result.threeDSecure.url,
      });
      window.location.assign(result.threeDSecure.url);
      return;
    }

    if (result.returnMessage !== "Success.") {
      setTransactionState({
        ...INITIAL_TRANSACTION_STATE,
        failureMessage: result.message || "Pagamento recusado.",
        paymentFailed: true,
      });
      return;
    }

    setTransactionState({
      ...INITIAL_TRANSACTION_STATE,
      paymentResult: result,
      pixGenerated: method === "pix",
    });

    invalidateSession();
  }

  function handlePaymentForbidden() {
    setCpfVerified(false);
    resetTransactionState();
    invalidateSession();
    queryClient.removeQueries({ queryKey: ["payment-provider-access-token", sessionId] });
    toast({
      title: "Confirme seu CPF novamente",
      description: "Sua validacao expirou ou nao foi encontrada.",
      variant: "destructive",
    });
  }

  function ensurePaymentProviderAccess() {
    if (hasPaymentProviderAccess) {
      return true;
    }

    toast({
      title: "Token de pagamento indisponivel",
      description: tokenRequest?.message || "Nao foi possivel preparar o provedor de pagamento.",
      variant: "destructive",
    });

    return false;
  }

  function handleUnexpectedError(title: string, description: string) {
    toast({ title, description, variant: "destructive" });
  }

  const handleCreditSubmit = async (data: CreditCardFormData) => {
    if (!session || !ensurePaymentProviderAccess()) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createCreditCardTransaction({
        sessionId,
        payload: {
          ...data,
          amount: session.pricing.total,
        },
      });

      handlePaymentResponse(result, "credit");
    } catch (error: unknown) {
      if (getAxiosStatus(error) === 403) {
        handlePaymentForbidden();
      } else {
        handleUnexpectedError("Erro ao processar pagamento", "Tente novamente.");
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const handleDebitSubmit = async (data: DebitCardFormData) => {
    if (!session || !ensurePaymentProviderAccess()) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createDebitCardTransaction({
        sessionId,
        payload: {
          ...data,
          amount: session.pricing.total,
          threeDSecure: {
            device: getThreeDSecureDevice(),
          },
        },
      });
      handlePaymentResponse(result, "debit");
    } catch (error: unknown) {
      if (getAxiosStatus(error) === 403) {
        handlePaymentForbidden();
      } else {
        handleUnexpectedError("Erro ao processar pagamento", "Tente novamente.");
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const handlePixGenerate = async () => {
    setIsProcessing(true);
    try {
      const result = await payCheckoutSession({ sessionId, payload: { method: "pix" } });
      handlePaymentResponse(result, "pix");
    } catch (error: unknown) {
      if (getAxiosStatus(error) === 403) {
        handlePaymentForbidden();
      } else {
        handleUnexpectedError("Erro ao gerar PIX", "Tente novamente.");
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
      <CheckoutShell>
        <ErrorState />
      </CheckoutShell>
    );
  }

  if (tokenError && selectedMethod !== "pix") {
    return (
      <CheckoutShell>
        <PaymentFailedState
          message="Nao foi possivel inicializar o provedor de pagamento."
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["payment-provider-access-token", sessionId] })}
        />
      </CheckoutShell>
    );
  }

  if (!cpfVerified && isPending) {
    return (
      <CpfVerification
        sessionId={sessionId}
        customerName={session.customer.name}
        maskedCpf={session.customer.cpf}
        expiresAt={session.expiresAt}
        onVerified={() => setCpfVerified(true)}
      />
    );
  }

  if (isPaid) {
    return (
      <CheckoutShell>
        <SuccessState
          transactionId={session.transactionId}
          total={session.pricing.total}
          method={session.completedMethod || "credit"}
        />
      </CheckoutShell>
    );
  }

  if (isExpired) {
    return (
      <CheckoutShell>
        <ExpiredState />
      </CheckoutShell>
    );
  }

  if (paymentFailed) {
    return (
      <CheckoutShell>
        <PaymentFailedState message={failureMessage} onRetry={handleRetry} />
      </CheckoutShell>
    );
  }

  if (threeDSecureUrl) {
    return (
      <CheckoutShell>
        <ThreeDSecureRedirectState url={threeDSecureUrl} embedded={threeDSecureEmbedded} />
      </CheckoutShell>
    );
  }

  if (isCancelled) {
    return (
      <CheckoutShell>
        <PaymentFailedState
          message={session.failureMessage || "Este pagamento foi cancelado."}
          onRetry={handleRetry}
        />
      </CheckoutShell>
    );
  }

  if (paymentResult?.success && !pixGenerated) {
    return (
      <CheckoutShell>
        <SuccessState
          transactionId={paymentResult.transactionId}
          total={session.pricing.total}
          method={selectedMethod}
        />
      </CheckoutShell>
    );
  }

  const expiresAt = new Date(session.expiresAt).getTime();
  const timeRemainingMs = Math.max(0, expiresAt - Date.now());
  const timeRemainingMin = Math.ceil(timeRemainingMs / 60000);
  const activeMethod = selectedMethod;

  return (
    <CheckoutShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {timeRemainingMin <= 5 && timeRemainingMin > 0 && (
          <div
            className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
            data-testid="warning-expiration"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Este link expira em <strong>{timeRemainingMin} minuto{timeRemainingMin > 1 ? "s" : ""}</strong>. Finalize seu pagamento.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-5">
            <CustomerInfoCard customer={session.customer} />
            <OrderSummaryCard order={session.order} />
            <PriceSummary pricing={session.pricing} />
          </div>

          <div className="lg:col-span-7">
            <Card data-testid="card-payment">
              <CardContent className="space-y-6 p-5 sm:p-6">
                <PaymentMethodSelector
                  methods={availableMethods}
                  selected={activeMethod}
                  onSelect={(method) => {
                    setSelectedMethod(method);
                    resetTransactionState();
                  }}
                />

                <div className="border-t pt-5">
                  {activeMethod === "credit" && (
                    <CreditCardForm
                      totalAmount={session.pricing.total}
                      onSubmit={handleCreditSubmit}
                      isProcessing={isProcessing || isTokenLoading}
                    />
                  )}

                  {activeMethod === "debit" && (
                    <DebitCardForm onSubmit={handleDebitSubmit} isProcessing={isProcessing || isTokenLoading} />
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
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
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
    </CheckoutShell>
  );
}
