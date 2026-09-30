"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { JourneyProgress } from "@/lib/api";
import { ArrowRight } from "@/components/ui/icons";
import styles from "./student-home.module.css";

// A few true things about the role they chose, from the role's own record in
// Discovery - pay, where it leads, how the day is spent. Not market headlines:
// those go stale and cannot be sourced from here. Closable, and it stays
// closed for that role in this browser.

type Role = NonNullable<JourneyProgress["role"]>;
const CHANGED = "ascend-role-facts";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

const thousands = (n: number) => `₹${Math.round(n / 1000)}K`;

export function RoleFacts({ role }: { role: Role }) {
  const key = `ascend.home.roleFactsHidden.${role.id}`;
  const hidden = useSyncExternalStore(
    subscribe,
    () => {
      try { return localStorage.getItem(key) === "1"; } catch { return false; }
    },
    () => false,
  );
  const facts = [
    role.payMonthly && { label: "Starting pay", value: `${thousands(role.payMonthly.min)}–${thousands(role.payMonthly.max)} a month` },
    role.next && { label: "Where it leads", value: `${role.next.title}${role.next.when ? `, ${role.next.when}` : ""}` },
    role.busiest && { label: "Most of the day", value: `${role.busiest.label} · ${role.busiest.share}%` },
  ].filter((f): f is { label: string; value: string } => Boolean(f));
  if (hidden || facts.length === 0) return null;

  function hide() {
    try { localStorage.setItem(key, "1"); } catch { /* stays shown this visit */ }
    window.dispatchEvent(new Event(CHANGED));
  }

  return (
    <section className={styles.roleFacts} aria-labelledby="role-facts-heading">
      <div className={styles.roleFactsHead}>
        <h2 id="role-facts-heading">Worth knowing about <strong>{role.title}</strong></h2>
        <button type="button" className={styles.roleFactsClose} onClick={hide} aria-label="Hide these facts">×</button>
      </div>
      <dl>
        {facts.map((fact) => (
          <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
        ))}
      </dl>
      <Link href="/discover">More about the role <ArrowRight size={13} /></Link>
    </section>
  );
}
