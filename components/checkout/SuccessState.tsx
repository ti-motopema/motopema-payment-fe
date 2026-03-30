"use client";

import { CheckCircle2 } from "lucide-react";
import { formatCurrency, completedMethodLabel } from "@/lib/formatters";

interface Props {
  transaction_id?: string;
  amount: number;
  method: string;
}

export default function SuccessState({ transaction_id, amount, method }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="state-success">
      <div className="text-center max-w-sm mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Pagamento Aprovado!</h2>
          <p className="text-muted-foreground text-sm">
            Seu pagamento de <strong className="text-foreground">{formatCurrency(amount)}</strong> via {completedMethodLabel(method)} foi processado com sucesso.
          </p>
        </div>

        {transaction_id && (
          <div className="rounded-md bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">ID da Transação</p>
            <p className="text-sm font-mono font-medium text-foreground" data-testid="text-transaction-id">
              {transaction_id}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Você receberá uma confirmação por e-mail em instantes.
          A Motopema entrará em contato para os próximos passos.
        </p>
      </div>
    </div>
  );
}
