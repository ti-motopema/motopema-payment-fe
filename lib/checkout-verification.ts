import { createHmac } from "crypto";

const SECRET_KEY = process.env.COOKIE_SECRET || "supersecret";
const COOKIE_PREFIX = "checkout-cpf-verified";

export type CheckoutVerificationCookiePayload = {
  sessionId: string;
  verifiedAt: number;
  expiresAt: string;
};

export function getCheckoutVerificationCookieName(sessionId: string) {
  return `${COOKIE_PREFIX}-${sessionId}`;
}

export function getCheckoutVerificationRemainingMaxAge(expiresAt: string) {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function createSignedCheckoutVerificationCookieValue(
  payload: CheckoutVerificationCookiePayload
) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SECRET_KEY).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function hasValidCheckoutVerificationCookieValue(
  sessionId: string,
  cookieValue?: string | null
) {
  if (!cookieValue) {
    return false;
  }

  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", SECRET_KEY)
    .update(encodedPayload)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as CheckoutVerificationCookiePayload;

    if (!payload.sessionId || !payload.expiresAt || !payload.verifiedAt) {
      return false;
    }

    if (payload.sessionId !== sessionId) {
      return false;
    }

    return getCheckoutVerificationRemainingMaxAge(payload.expiresAt) > 0;
  } catch {
    return false;
  }
}
