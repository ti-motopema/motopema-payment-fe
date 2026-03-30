"use client";

import { XCircle } from "lucide-react";

export default function CancelledState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="state-cancelled">
      <div className="text-center max-w-sm mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
          <XCircle className="w-10 h-10 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Pagamento Cancelado</h2>
          <p className="text-muted-foreground text-sm">
            Você cancelou este link de pagamento. Por segurança, ele não pode mais ser utilizado.
          </p>
        </div>

        <div className="rounded-md bg-muted/50 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-foreground">Precisa pagar?</p>
          <p className="text-xs text-muted-foreground">
            Entre em contato com seu consultor Motopema para solicitar um novo link de pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}
