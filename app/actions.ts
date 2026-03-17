"use server";

import { cookies } from "next/headers";
import {
  createSignedCheckoutVerificationCookieValue,
  getCheckoutVerificationCookieName,
  getCheckoutVerificationRemainingMaxAge,
  hasValidCheckoutVerificationCookieValue,
} from "@/lib/checkout-verification";

export async function setCheckoutVerificationCookie(sessionId: string, expiresAt: string) {
  const signedValue = createSignedCheckoutVerificationCookieValue({
    sessionId,
    verifiedAt: Date.now(),
    expiresAt,
  });
  const maxAge = getCheckoutVerificationRemainingMaxAge(expiresAt);

  if (maxAge <= 0) {
    return false;
  }

  (await cookies()).set(getCheckoutVerificationCookieName(sessionId), signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return true;
}

export async function hasValidCheckoutVerificationCookie(sessionId: string) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getCheckoutVerificationCookieName(sessionId));
  return hasValidCheckoutVerificationCookieValue(sessionId, cookie?.value);
}

export async function clearCheckoutVerificationCookie(sessionId: string) {
  (await cookies()).delete(getCheckoutVerificationCookieName(sessionId));
}
