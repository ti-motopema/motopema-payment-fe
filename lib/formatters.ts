export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiryDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function formatCVV(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return cardNumber;
  return `**** **** **** ${digits.slice(-4)}`;
}

export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `***.***.${digits.slice(6, 9)}-**`;
}

const DEAL_TYPE_LABELS: Record<string, string> = {
  motorcycle: "Moto",
  financing: "Financiamento",
  consortium: "Consórcio",
  entrance: "Entrada",
};

export function dealTypeLabel(dealType: string): string {
  return DEAL_TYPE_LABELS[dealType] ?? dealType;
}

const COMPLETED_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  // Internal UI names (fallback, used before session refreshes)
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
};

export function completedMethodLabel(method: string): string {
  return COMPLETED_METHOD_LABELS[method] ?? method;
}
