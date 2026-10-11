"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/** A pending server navigation always leaves a way back to the last screen. */
export function LoadingRecovery() {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setDelayed(true), 20_000); return () => clearTimeout(timer); }, []);
  return <main className="mx-auto w-full max-w-(--page-max-width) px-4 py-8" aria-busy={!delayed}>
    <h1 className="text-2xl font-semibold">{delayed ? "This is taking longer than expected" : "Opening your workspace…"}</h1>
    <p role="status" className="my-4">{delayed ? "We could not finish loading your saved work. This does not mean it has been deleted. Retry to load the last saved version." : "Loading your saved work."}</p>
    <div className="flex flex-wrap gap-4">
      {delayed && <button type="button" className="min-h-11 rounded-xl bg-brand-violet px-5 text-white" onClick={() => window.location.reload()}>Retry loading</button>}
      <Link href="/" className="min-h-11 inline-flex items-center underline">Return to Home</Link>
      <button type="button" className="min-h-11 underline" onClick={() => window.history.back()}>Go back</button>
    </div>
  </main>;
}
