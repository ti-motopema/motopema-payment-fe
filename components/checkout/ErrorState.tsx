"use client";

import { AlertTriangle, LinkIcon } from "lucide-react";

interface Props {
  message?: string;
}

export default function ErrorState({ message }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="state-error">
      <div className="text-center max-w-sm mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <LinkIcon className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Link Inválido</h2>
          <p className="text-muted-foreground text-sm">
            {message || "Este código de pagamento não existe em nosso sistema. Verifique se o link está correto ou solicite um novo ao seu consultor Motopema."}
          </p>
        </div>

        <div className="rounded-md bg-muted/50 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-foreground">Possíveis motivos:</p>
          <ul className="text-xs text-muted-foreground space-y-1 text-left list-disc list-inside">
            <li>O link foi digitado incorretamente</li>
            <li>O link já foi utilizado e não está mais disponível</li>
            <li>O link não foi gerado pelo sistema Motopema</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Entre em contato com a Motopema pelo telefone ou WhatsApp para obter um novo link de pagamento.
        </p>
      </div>
    </div>
  );
}
