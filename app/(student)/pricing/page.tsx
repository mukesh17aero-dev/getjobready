import { getPricing } from "@/lib/api";
import { BackLink } from "@/components/ui/back-link";
import { CheckoutButton } from "@/features/commerce";

// Placeholder prices from the backend, and a real Razorpay checkout behind
// each button. Paying does not yet unlock anything - no route checks an
// entitlement - so this page exists to prove the payment pipeline itself
// works, end to end, before anything is wired to depend on it.

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

const COPY: Record<string, { title: string; description: string }> = {
  resume: { title: "Resume Studio", description: "Build and refine a resume grounded in your own record." },
  discovery: { title: "Career Discovery", description: "Find roles that fit how you actually work." },
  readiness: { title: "Readiness Assessment", description: "See what you can already do for a role, and what to fix." },
  practice: { title: "Simulation Practice", description: "Real workplace tasks, marked, that an employer can look at." },
  interview: { title: "Interview Practice", description: "Rehearse with feedback on what you actually said." },
  full_journey: { title: "Full Journey", description: "Everything above, bundled." },
};

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function PricingPage() {
  const result = await getPricing();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/" fallbackLabel="Back to Home" />

      <header className="mt-4 mb-4">
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          Pricing
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          Placeholder prices — nothing above is final yet.
        </p>
      </header>

      {!result ? (
        <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-center text-[0.9rem] text-slate-600">
          Pricing could not load. The server may be waking up — give it a moment and reload.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {result.products.map((p) => {
            const copy = COPY[p.product] ?? { title: p.product, description: "" };
            return (
              <li key={p.product} className="rounded-2xl border border-slate-200 bg-surface p-4">
                <h2 className="font-display text-[1rem] font-bold text-brand-ink">{copy.title}</h2>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-600">{copy.description}</p>
                <p className="mt-3 text-[1.3rem] font-bold text-brand-ink">{formatRupees(p.amountPaise)}</p>
                <div className="mt-3">
                  <CheckoutButton product={p.product} label={`Buy ${copy.title}`} title={copy.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
