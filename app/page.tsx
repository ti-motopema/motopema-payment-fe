import Header from "@/components/checkout/Header";
import ErrorState from "@/components/checkout/ErrorState";
import SecurityFooter from "@/components/checkout/SecurityFooter";

export const metadata = {
  title: "Link Inválido — Motopema",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ErrorState message="Nenhum código de sessão foi informado. Acesse o link de pagamento que foi enviado a você pela Motopema." />
      <SecurityFooter />
    </div>
  );
}
