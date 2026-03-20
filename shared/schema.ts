import { z } from "zod";

export const paymentMethodEnum = z.enum(["credit", "debit", "pix"]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const sessionStatusEnum = z.enum([
  "pending",
  "paid",
  "expired",
  "cancelled",
]);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const checkoutSessionSchema = z.object({
  session_id: z.string(),
  status: sessionStatusEnum,
  deal_id: z.string(),
  deal_type: z.string(),
  payment_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string(),
  completed_at: z.string().nullable(),
  completed_method: paymentMethodEnum.nullable(),
  expired_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  failure_reason: z.string().nullable(),
  customer: z.object({
    id: z.number(),
    name: z.string(),
    cpf: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  order: z.object({
    id: z.number(),
    order_number: z.string(),
    description: z.string(),
    model: z.string(),
    color: z.string(),
    year: z.string(),
    amount: z.string(),
    notes: z.string().nullable(),
  }),
});

export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const creditCardFormSchema = z.object({
  cardholderName: z.string().min(3, "Nome do titular obrigatório"),
  cardNumber: z.string().min(19, "Número do cartão inválido"),
  expiryDate: z.string().min(5, "Data de validade inválida"),
  cvv: z.string().min(3, "CVV inválido"),
  installments: z.number().min(1).max(12),
});

export type CreditCardFormData = z.infer<typeof creditCardFormSchema>;

export const debitCardFormSchema = z.object({
  cardholderName: z.string().min(3, "Nome do titular obrigatório"),
  cardNumber: z.string().min(19, "Número do cartão inválido"),
  expiryDate: z.string().min(5, "Data de validade inválida"),
  cvv: z.string().min(3, "CVV inválido"),
});

export type DebitCardFormData = z.infer<typeof debitCardFormSchema>;

/**
 * Browser fingerprint data collected client-side for 3-D Secure (debit card).
 * IP address is added server-side from request headers.
 */
export const browserDataSchema = z.object({
  userAgent: z.string(),
  colorDepth: z.number(),
  javaEnabled: z.boolean(),
  language: z.string(),
  screenHeight: z.number(),
  screenWidth: z.number(),
  timeZoneOffset: z.number(),
});

export type BrowserData = z.infer<typeof browserDataSchema>;

export const paymentResultSchema = z.object({
  success: z.boolean(),
  transaction_id: z.string().optional(),
  pix_code: z.string().optional(),
  pix_qr_code: z.string().optional(),
  message: z.string().optional(),
});

export type PaymentResult = z.infer<typeof paymentResultSchema>;

export const users = undefined;
export type InsertUser = never;
export type User = never;
