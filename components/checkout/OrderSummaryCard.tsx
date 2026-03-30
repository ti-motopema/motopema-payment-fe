"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bike, Hash, Palette, Calendar, Tag } from "lucide-react";
import { dealTypeLabel } from "@/lib/formatters";
import type { CheckoutSession } from "@/shared/schema";

interface Props {
  order: CheckoutSession["order"];
  dealType: string;
}

export default function OrderSummaryCard({ order, dealType }: Props) {
  return (
    <Card data-testid="card-order-summary">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bike className="w-4 h-4 text-muted-foreground" />
          Detalhes do Pedido
        </h3>

        <div className="mb-4">
          <p className="text-base font-semibold text-foreground" data-testid="text-order-model">
            {order?.description}
          </p>
        </div>

        <div className="space-y-3">
          <DetailRow icon={<Tag className="w-3.5 h-3.5" />} label="Tipo de venda" value={dealTypeLabel(dealType)} testId="text-deal-type" />
          <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Pedido" value={order?.order_number} testId="text-order-number" />
          <DetailRow icon={<Palette className="w-3.5 h-3.5" />} label="Cor" value={order?.color} testId="text-order-color" />
          <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Ano" value={order?.year} testId="text-order-year" />
        </div>

        {order?.notes && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Observações</p>
            <p className="text-sm text-foreground" data-testid="text-order-notes">{order.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: string; testId: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex items-center justify-between gap-1 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground truncate" data-testid={testId}>{value}</span>
      </div>
    </div>
  );
}
