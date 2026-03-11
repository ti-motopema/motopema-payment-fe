"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message?: string;
  onRetry: () => void;
}

export default function PaymentFailedState({ message, onRetry }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="state-payment-failed">
      <div className="text-center max-w-sm mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Pagamento Recusado</h2>
          <p className="text-muted-foreground text-sm">
            {message || "Não foi possível processar seu pagamento. Verifique os dados do cartão e tente novamente."}
          </p>
        </div>

        <Button
          onClick={onRetry}
          size="lg"
          className="w-full max-w-xs"
          data-testid="button-retry-payment"
        >
          Tentar Novamente
        </Button>

        <p className="text-xs text-muted-foreground">
          Caso o problema persista, entre em contato com seu consultor Motopema.
        </p>
      </div>
    </div>
  );
}
