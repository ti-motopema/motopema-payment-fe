"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Check, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

interface Props {
  amount: number;
  onGeneratePix: () => void;
  isProcessing: boolean;
  pix_code?: string;
  pixGenerated: boolean;
}

export default function PixPaymentPanel({ amount, onGeneratePix, isProcessing, pix_code, pixGenerated }: Props) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!pixGenerated) return;
    setAwaitingConfirmation(true);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixGenerated]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopy = async () => {
    if (!pix_code) return;
    try {
      await navigator.clipboard.writeText(pix_code);
      setCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  if (!pixGenerated) {
    return (
      <div className="space-y-5" data-testid="pix-panel-initial">
        <div className="text-center space-y-3 py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Pague instantaneamente com PIX
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              O QR Code será gerado ao clicar no botão abaixo
            </p>
          </div>
        </div>

        <div className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
          <p>Pagamento à vista via PIX no valor de <strong className="text-foreground">{formatCurrency(amount)}</strong></p>
          <p>O código tem validade de 30 minutos após a geração.</p>
        </div>

        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={onGeneratePix}
          disabled={isProcessing}
          data-testid="button-generate-pix"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Gerando PIX...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Gerar PIX
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="pix-panel-generated">
      {timeLeft > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Expira em</span>
          <span className="font-mono font-semibold text-foreground" data-testid="text-pix-timer">
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="text-center text-sm text-destructive font-medium">
          PIX expirado. Gere um novo código.
        </div>
      )}

      <div className="flex justify-center py-4">
        <div className="w-48 h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-background" data-testid="img-pix-qrcode">
          <div className="text-center space-y-2">
            <QrCode className="w-20 h-20 mx-auto text-foreground" />
            <p className="text-xs text-muted-foreground">QR Code PIX</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Código PIX (copia e cola)</label>
        <div className="relative">
          <div className="bg-muted/50 rounded-md px-3 py-2.5 pr-10 text-xs font-mono break-all leading-relaxed text-foreground" data-testid="text-pix-code">
            {pix_code}
          </div>
          <Button
            onClick={handleCopy}
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1"
            type="button"
            data-testid="button-copy-pix"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {awaitingConfirmation && timeLeft > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border border-amber-200 dark:border-amber-800" data-testid="status-awaiting-pix">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Aguardando pagamento</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Escaneie o QR Code ou copie o código acima.</p>
          </div>
        </div>
      )}
    </div>
  );
}
