"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, FileText } from "lucide-react";
import type { CheckoutSession } from "@/shared/schema";

interface Props {
  customer: CheckoutSession["customer"];
}

export default function CustomerInfoCard({ customer }: Props) {
  return (
    <Card data-testid="card-customer-info">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Dados do Cliente
        </h3>
        <div className="space-y-3">
          <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Nome" value={customer.name} testId="text-customer-name" />
          <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="CPF" value={customer.cpf} testId="text-customer-cpf" />
          <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Telefone" value={customer.phone} testId="text-customer-phone" />
          <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="E-mail" value={customer.email} testId="text-customer-email" />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: string; testId: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate" data-testid={testId}>{value}</p>
      </div>
    </div>
  );
}
