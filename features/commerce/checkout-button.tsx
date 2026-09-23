"use client";

import { useState } from "react";
import Script from "next/script";
import { startCheckout, verifyPayment, type Product } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

// One button: start a Razorpay order server-side (server decides the price),
// open Razorpay's own checkout widget, and verify the result server-side
// before ever treating the purchase as real. Nothing here grants access on
// its own - a client-side "success" is a claim, not a fact.

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = { open(): void };
type RazorpayConstructor = new (options: {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}) => RazorpayInstance;
declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function CheckoutButton({
  product,
  label,
  title,
}: {
  product: Product;
  label: string;
  /** Shown inside the Razorpay widget itself. */
  title: string;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "verifying" | "paid" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Sign in first, then try again.");
      return;
    }
    const order = await startCheckout(t, product);
    if (!order.ok) {
      setBusy(false);
      setError(order.reason);
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      setBusy(false);
      setError("Payment widget is still loading — try again in a moment.");
      return;
    }
    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.orderId,
      name: "ASCEND",
      description: title,
      handler: (response) => {
        void (async () => {
          setStatus("verifying");
          const verified = await verifyPayment(t, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setBusy(false);
          if (verified.ok) {
            setStatus("paid");
          } else {
            setStatus("error");
            setError(verified.reason);
          }
        })();
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
        },
      },
    });
    razorpay.open();
  };

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} strategy="afterInteractive" />
      {status === "paid" ? (
        <span className="inline-flex min-h-10 items-center rounded-xl bg-teal-50 px-4 text-[0.8rem] font-bold text-teal-800 ring-1 ring-inset ring-teal-600/25">
          Paid — you have access
        </span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void pay()}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (status === "verifying" ? "Confirming…" : "One moment…") : label}
        </button>
      )}
      {error && <p className="mt-1.5 text-[0.75rem] text-rose-800">{error}</p>}
    </div>
  );
}
