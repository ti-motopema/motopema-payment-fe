"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, UserCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
interface Props {
  sessionId: string;
  customerName: string;
  maskedCpf: string;
  onVerified: () => void;
}

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function CpfVerification({ sessionId, customerName, maskedCpf, onVerified }: Props) {
  const [cpf, setCpf] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      setErrorMessage("Digite um CPF válido com 11 dígitos.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    try {
      await apiRequest("POST", `/api/checkout/${sessionId}/verify-cpf`, { cpf: digits });
      onVerified();
    } catch (err: any) {
      try {
        const text = err.message || "";
        if (text.includes("401")) {
          setErrorMessage("CPF não corresponde ao cadastro desta compra.");
        } else {
          setErrorMessage("Erro ao verificar. Tente novamente.");
        }
      } catch {
        setErrorMessage("Erro ao verificar. Tente novamente.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="cpf-verification-page">
      <header className="w-full border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 flex-wrap">
          <img src="/motopema-logo.png" alt="Motopema Honda" className="h-8 sm:h-10 object-contain" />
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span>Pagamento Seguro</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md" data-testid="card-cpf-verification">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Verificação de Identidade</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Para sua segurança, confirme seu CPF antes de acessar o pagamento.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium text-foreground" data-testid="text-verify-customer-name">{customerName}</p>
              <p className="text-xs text-muted-foreground mt-1">CPF cadastrado: <span className="font-mono" data-testid="text-verify-masked-cpf">{maskedCpf}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cpf-input" className="text-sm font-medium text-foreground mb-1.5 block">
                  Digite seu CPF
                </label>
                <Input
                  id="cpf-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(formatCpfInput(e.target.value));
                    setErrorMessage("");
                  }}
                  maxLength={14}
                  data-testid="input-cpf-verify"
                  className={errorMessage ? "border-destructive" : ""}
                />
                {errorMessage && (
                  <p className="text-xs text-destructive mt-1.5" data-testid="text-cpf-error">{errorMessage}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isVerifying || cpf.replace(/\D/g, "").length < 11}
                data-testid="button-verify-cpf"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  "Confirmar e Continuar"
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              Essa verificação garante que apenas o titular da compra acesse este pagamento.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
