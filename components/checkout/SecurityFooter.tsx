"use client";

import { Shield, Lock, Eye } from "lucide-react";

export default function SecurityFooter() {
  return (
    <footer className="mt-8 pb-8" data-testid="security-footer">
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Conexão criptografada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Dados protegidos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          <span>Não armazenamos dados do cartão</span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Motopema Honda &mdash; Pagamento seguro
      </p>
    </footer>
  );
}
