"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creditCardFormSchema, type CreditCardFormData } from "@/shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCardNumber, formatExpiryDate, formatCVV, formatCurrency } from "@/lib/formatters";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  amount: number;
  onSubmit: (data: CreditCardFormData) => void;
  isProcessing: boolean;
}

function buildInstallmentOptions(amount: number) {
  const total = amount;
  if (!total || total <= 0) return [];
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return {
      installments: n,
      value: total / n,
    };
  });
}

export default function CreditCardForm({ amount, onSubmit, isProcessing }: Props) {
  const installmentOptions = buildInstallmentOptions(amount);

  const form = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardFormSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      installments: 1,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-credit-card">
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome no cartão</FormLabel>
              <FormControl>
                <Input
                  placeholder="Como está impresso no cartão"
                  data-testid="input-cardholder-name"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do cartão</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="0000 0000 0000 0000"
                    data-testid="input-card-number"
                    className="pl-10"
                    {...field}
                    onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validade</FormLabel>
                <FormControl>
                  <Input
                    placeholder="MM/AA"
                    data-testid="input-expiry-date"
                    {...field}
                    onChange={(e) => field.onChange(formatExpiryDate(e.target.value))}
                    maxLength={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="123"
                      data-testid="input-cvv"
                      className="pl-9"
                      {...field}
                      onChange={(e) => field.onChange(formatCVV(e.target.value))}
                      maxLength={4}
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="installments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcelas</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(val) => field.onChange(Number(val))}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-installments">
                    <SelectValue placeholder="Selecione o parcelamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {installmentOptions.map((opt) => (
                    <SelectItem key={opt.installments} value={String(opt.installments)}>
                      {opt.installments}x de {formatCurrency(opt.value)} sem juros
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          disabled={isProcessing}
          data-testid="button-pay-credit"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagar com Cartão de Crédito
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
