"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  embedded?: boolean;
}

export default function ThreeDSecureRedirectState({ url, embedded }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="state-3ds-redirect">
      <div className="text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Autenticação do Cartão</h2>
          <p className="text-muted-foreground text-sm">
            Seu banco solicitou a autenticação 3D Secure para continuar o pagamento no débito.
            {embedded ? " A autenticação será aberta na próxima etapa." : " Você será redirecionado para concluir a validação."}
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="w-full max-w-xs"
          data-testid="button-continue-3ds"
        >
          <a href={url}>Continuar autenticação</a>
        </Button>

        <p className="text-xs text-muted-foreground">
          Se o redirecionamento não acontecer automaticamente, use o botão acima para prosseguir.
        </p>
      </div>
    </div>
  );
}
