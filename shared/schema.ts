import { z } from "zod";

// ─── Payment method (internal UI names) ───────────────────────────────────────
export const paymentMethodEnum = z.enum(["credit", "debit", "pix"]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

// ─── Completed method (backend/session names) ─────────────────────────────────
export const completedMethodEnum = z.enum(["pix", "credit_card", "debit_card"]);
export type CompletedMethod = z.infer<typeof completedMethodEnum>;

// ─── Deal type ────────────────────────────────────────────────────────────────
export const dealTypeEnum = z.enum(["motorcycle", "financing", "consortium", "entrance"]);
export type DealType = z.infer<typeof dealTypeEnum>;

// ─── Session status ───────────────────────────────────────────────────────────
export const sessionStatusEnum = z.enum([
  "pending",
  "processing",
  "approved",
  "failed",
  "expired",
  "cancelled",
]);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

// ─── Checkout session (flattened for the frontend) ────────────────────────────
export const checkoutSessionSchema = z.object({
  // Session fields
  session_id: z.string(),
  status: sessionStatusEnum,
  deal_type: dealTypeEnum,
  completed_method: completedMethodEnum.nullable(),
  expires_at: z.string(),
  failure_reason: z.string().nullable(),

  // Customer
  customer: z.object({
    id: z.number(),
    name: z.string(),
    cpf: z.string(),
    phone: z.string(),
    email: z.string(),
    contact_id: z.string(),
  }),

  // Order
  order: z.object({
    id: z.number(),
    order_number: z.string(),
    description: z.string(),
    model: z.string(),
    color: z.string(),
    year: z.string(),
    installments: z.number(),
    amount: z.number(),
    notes: z.string().nullable(),
  }),
});

export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

// ─── Card form schemas ────────────────────────────────────────────────────────

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

// ─── Browser fingerprint (3-D Secure) ────────────────────────────────────────
/**
 * Collected client-side. IP address is added server-side from request headers.
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

// ─── Payment result ───────────────────────────────────────────────────────────
export const paymentResultSchema = z.object({
  success: z.boolean(),
  transaction_id: z.string().optional(),
  pix_code: z.string().optional(),
  pix_qr_code: z.string().optional(),
  message: z.string().optional(),
});

export type PaymentResult = z.infer<typeof paymentResultSchema>;

// ─── Stub (required by template tooling) ──────────────────────────────────────
export const users = undefined;
export type InsertUser = never;
export type User = never;
