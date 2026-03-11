"use client";

import { Clock } from "lucide-react";

export default function ExpiredState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="state-expired">
      <div className="text-center max-w-sm mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Link Expirado</h2>
          <p className="text-muted-foreground text-sm">
            O prazo de 15 minutos para realizar o pagamento foi excedido. Por segurança, este link não está mais disponível.
          </p>
        </div>

        <div className="rounded-md bg-muted/50 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-foreground">O que fazer agora?</p>
          <p className="text-xs text-muted-foreground">
            Entre em contato com seu consultor Motopema para solicitar um novo link de pagamento. Um novo link será enviado diretamente para você.
          </p>
        </div>
      </div>
    </div>
  );
}
