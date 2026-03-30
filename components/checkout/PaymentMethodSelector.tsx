"use client";

import { CreditCard, Landmark, QrCode } from "lucide-react";
import type { PaymentMethod } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  methods: PaymentMethod[];
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const methodConfig: Record<PaymentMethod, { icon: typeof CreditCard; label: string }> = {
  credit: { icon: CreditCard, label: "Crédito" },
  debit: { icon: Landmark, label: "Débito" },
  pix: { icon: QrCode, label: "PIX" },
};

export default function PaymentMethodSelector({ methods, selected, onSelect }: Props) {
  return (
    <div data-testid="payment-method-selector">
      <h3 className="text-sm font-semibold text-foreground mb-3">Forma de Pagamento</h3>
      <div className="grid grid-cols-3 gap-2">
        {methods.map((method) => {
          const config = methodConfig[method];
          const Icon = config.icon;
          const isActive = selected === method;
          return (
            <Button
              key={method}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => onSelect(method)}
              data-testid={`button-method-${method}`}
              className={cn(
                "flex flex-col items-center gap-1.5 h-auto",
                !isActive && "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{config.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
