import { z } from "zod";

export const paymentMethodEnum = z.enum(["credit", "debit", "pix"]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const sessionStatusEnum = z.enum(["pending", "paid", "expired", "cancelled"]);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const checkoutSessionSchema = z.object({
  sessionId: z.string(),
  status: sessionStatusEnum,
  paymentType: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  completedAt: z.string().optional(),
  completedMethod: z.string().optional(),
  transactionId: z.string().optional(),
  failureMessage: z.string().optional(),
  customer: z.object({
    name: z.string(),
    cpf: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  order: z.object({
    proposalId: z.string(),
    orderNumber: z.string(),
    description: z.string(),
    model: z.string(),
    color: z.string(),
    year: z.string(),
    notes: z.string().optional(),
  }),
  pricing: z.object({
    subtotal: z.number(),
    downPayment: z.number().optional(),
    total: z.number(),
  }),
  availablePaymentMethods: z.array(paymentMethodEnum),
  installments: z.array(z.object({ // Trocar para "installmentOptions" futuramente.
    installments: z.number(),
    value: z.number(),
    total: z.number(),
    interestRate: z.number(),
  })),
});

export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const creditCardFormSchema = z.object({
  cardholderName: z.string().min(3, "Nome do titular obrigatório"),
  cardNumber: z.string().min(19, "Número do cartão inválido"),
  expiryDate: z.string().min(5, "Data de validade inválida"),
  cvv: z.string().min(3, "CVV inválido"),
  installments: z.number().min(1),
});

export type CreditCardFormData = z.infer<typeof creditCardFormSchema>;

export const debitCardFormSchema = z.object({
  cardholderName: z.string().min(3, "Nome do titular obrigatório"),
  cardNumber: z.string().min(19, "Número do cartão inválido"),
  expiryDate: z.string().min(5, "Data de validade inválida"),
  cvv: z.string().min(3, "CVV inválido"),
});

export type DebitCardFormData = z.infer<typeof debitCardFormSchema>;

export const paymentResultSchema = z.object({
  success: z.boolean().optional(),
  dateTime: z.string().optional(),
  returnCode: z.string().optional(),
  transactionId: z.string().optional(),
  pixCode: z.string().optional(),
  pixQrCode: z.string().optional(),
  returnMessage: z.string().optional(),
  threeDSecure: z.object({
    embedded: z.boolean().optional(),
    url: z.string().optional(),
  }).optional(),
  message: z.string().optional(),
});

export type PaymentResult = z.infer<typeof paymentResultSchema>;

export const users = undefined;
export type InsertUser = never;
export type User = never;
