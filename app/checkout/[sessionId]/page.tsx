import { hasValidCheckoutVerificationCookie } from "@/app/actions";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CheckoutPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { sessionId } = await params;
  const initialCpfVerified = await hasValidCheckoutVerificationCookie(sessionId);

  return <CheckoutClient sessionId={sessionId} initialCpfVerified={initialCpfVerified} />;
}
