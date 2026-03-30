"use client";

import { Shield } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full border-b bg-background" data-testid="checkout-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 flex-wrap">
        <img
          src="/motopema-logo.png"
          alt="Motopema Honda"
          className="h-12 sm:h-16 object-contain"
          data-testid="img-logo"
        />
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
          <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          <span>Pagamento Seguro</span>
        </div>
      </div>
    </header>
  );
}
