"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debitCardFormSchema, type DebitCardFormData } from "@/shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCardNumber, formatExpiryDate, formatCVV } from "@/lib/formatters";
import { Landmark, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSubmit: (data: DebitCardFormData) => void;
  isProcessing: boolean;
}

export default function DebitCardForm({ onSubmit, isProcessing }: Props) {
  const form = useForm<DebitCardFormData>({
    resolver: zodResolver(debitCardFormSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-debit-card">
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome no cartão</FormLabel>
              <FormControl>
                <Input
                  placeholder="Como está impresso no cartão"
                  data-testid="input-debit-cardholder-name"
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
                    data-testid="input-debit-card-number"
                    className="pl-10"
                    {...field}
                    onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                    data-testid="input-debit-expiry-date"
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
                      data-testid="input-debit-cvv"
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

        <div className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          Pagamento à vista no débito. O valor será debitado imediatamente.
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          disabled={isProcessing}
          data-testid="button-pay-debit"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Pagar com Débito
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
