// Commerce: prices, checkout and entitlements.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.
//
// The price shown here is never trusted for the charge itself - the backend
// decides what gets charged from its own PRICING table. This is display only.

import { API_URL, apiCall, requestHeaders } from "./core";

export const PRODUCTS = ["resume", "discovery", "readiness", "practice", "interview", "full_journey"] as const;
export type Product = (typeof PRODUCTS)[number];

export type PricedProduct = { product: Product; amountPaise: number; currency: string };

export type Entitlement = {
  id: string;
  product: Product;
  source: "purchase" | "college_sponsorship" | "employer_sponsorship" | "pilot_grant";
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
};

/** Public: what things cost. No account needed to see a price. */
export async function getPricing(): Promise<{ products: PricedProduct[] } | null> {
  try {
    const res = await fetch(`${API_URL}/v1/commerce/pricing`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { products: PricedProduct[] };
  } catch {
    return null;
  }
}

export const getMyEntitlements = (token: string) =>
  apiCall<{ entitlements: Entitlement[] }>(token, "/v1/entitlements");

export const getEntitlement = (token: string, product: Product) =>
  apiCall<{ entitled: boolean }>(token, `/v1/entitlements/${product}`);

export type CheckoutOrder =
  | { ok: true; orderId: string; amountPaise: number; currency: string; keyId: string }
  | { ok: false; reason: string };

/**
 * Not apiCall: a refusal (already owns it, or payments unset) comes with a
 * specific reason worth showing, not apiCall's generic null.
 */
export async function startCheckout(token: string, product: Product): Promise<CheckoutOrder> {
  try {
    const res = await fetch(`${API_URL}/v1/commerce/checkout`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify({ product }),
    });
    const body = (await res.json().catch(() => null)) as
      | { orderId: string; amountPaise: number; currency: string; keyId: string }
      | { error: string }
      | null;
    if (res.ok && body && "orderId" in body) return { ok: true, ...body };
    return { ok: false, reason: body && "error" in body ? body.error : "Could not start checkout right now." };
  } catch {
    return { ok: false, reason: "Could not reach the server." };
  }
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export async function verifyPayment(
  token: string,
  args: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
): Promise<VerifyResult> {
  try {
    const res = await fetch(`${API_URL}/v1/commerce/verify`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify(args),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { error: string } | null;
    return { ok: false, reason: body?.error ?? "Payment could not be verified." };
  } catch {
    return { ok: false, reason: "Could not reach the server." };
  }
}
