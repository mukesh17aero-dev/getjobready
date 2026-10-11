"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/ui/icons";

// The sheet a college or employer sends to get an account.
//
// It builds a mailto rather than posting anywhere, because there is no
// endpoint to post to yet - this repo holds no business logic, and receiving a
// form is backend work. That trade is worth naming: it works today with no
// backend at all, but it needs a mail client at the other end, and the address
// is readable in the page source. The durable version is one endpoint on
// ascend-backend (POST /v1/access-requests) taking these same six fields.
//
// The kind is fixed by the page rather than chosen here. Somebody on
// /for/colleges has already said which they are by being on that page, and a
// toggle would ask them again.

const INBOX = "issac1993@gmail.com";

const FIELDS: Array<{ id: string; label: string; hint: string; type?: string }> = [
  { id: "org", label: "Organisation", hint: "College or company name" },
  { id: "name", label: "Your name", hint: "" },
  { id: "email", label: "Work email", hint: "We reply here", type: "email" },
  { id: "role", label: "Your role", hint: "e.g. Placement Officer" },
];

export function RequestAccess({ kind }: { kind: "college" | "employer" }) {
  const [sent, setSent] = useState(false);

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const body = [
      `Organisation: ${get("org")}`,
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Role: ${get("role")}`,
      `Type: ${kind}`,
      "",
      get("note") || "(no note)",
    ].join("\n");
    window.location.href = `mailto:${INBOX}?subject=${encodeURIComponent(
      `Ascend access request - ${get("org") || kind}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) {
    return (
      <section className="mt-5 rounded-2xl border border-teal-600/30 bg-teal-50/60 p-6 text-center">
        <h2 className="font-display text-[1.1rem] font-bold text-brand-ink">
          Your email client should have opened.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[0.86rem] leading-relaxed text-slate-600">
          Send the message and somebody from Ascend will reach out to you.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 cursor-pointer text-[0.78rem] font-semibold text-brand-teal-deep underline underline-offset-2"
        >
          Fill it in again
        </button>
      </section>
    );
  }

  return (
    <form
      onSubmit={send}
      className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5"
    >
      <h2 className="font-display text-[1.15rem] font-bold text-brand-ink">
        Request access
      </h2>
      <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-500">
        Tell us who you are and we will reach out to you.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.id} className="block">
            <span className="block text-[0.76rem] font-semibold text-brand-ink">
              {f.label}
            </span>
            <input
              required
              type={f.type ?? "text"}
              name={f.id}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] text-brand-ink outline-none focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/25"
            />
            {f.hint && (
              <span className="mt-0.5 block text-[0.75rem] text-slate-500">
                {f.hint}
              </span>
            )}
          </label>
        ))}
        <label className="block sm:col-span-2">
          <span className="block text-[0.76rem] font-semibold text-brand-ink">
            What are you hoping to do?{" "}
            <span className="font-normal text-slate-500">Optional</span>
          </span>
          <textarea
            name="note"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] text-brand-ink outline-none focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/25"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-teal-deep px-5 py-2.5 text-[0.85rem] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal motion-reduce:hover:translate-y-0"
      >
        Send request
        <ArrowRight size={15} />
      </button>
      <p className="mt-2 text-[0.75rem] text-slate-500">
        Opens your mail client with the answers filled in.
      </p>
    </form>
  );
}
