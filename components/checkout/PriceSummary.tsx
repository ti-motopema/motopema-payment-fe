"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { CheckoutSession } from "@/shared/schema";
import { Separator } from "@/components/ui/separator";

interface Props {
  pricing: CheckoutSession["pricing"];
}

export default function PriceSummary({ pricing }: Props) {
  return (
    <Card data-testid="card-price-summary">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Resumo do Pagamento
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm text-muted-foreground">Valor do veículo</span>
            <span className="text-sm font-medium" data-testid="text-subtotal">
              {formatCurrency(pricing?.subtotal)}
            </span>
          </div>
          {pricing?.downPayment && pricing?.downPayment > 0 && (
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm text-muted-foreground">Entrada</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400" data-testid="text-down-payment">
                - {formatCurrency(pricing?.downPayment)}
              </span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-1">
            <span className="text-base font-semibold text-foreground">Total a pagar</span>
            <span className="text-xl font-bold text-primary" data-testid="text-total">
              {formatCurrency(pricing?.total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
