"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiCall } from "@/lib/api/core";
import { supabaseBrowser } from "@/lib/supabase-browser";
import ws from "./discovery-workspace.module.css";

type Point = { text: string; source: string; href?: string };
export type Alignment = {
  roleId: string;
  interest: Point[];
  background: Point[];
  strengths: Point[];
  growth: Point[];
  unassessed: string[];
  next: { label: string; href: string };
};

export function AlignmentContent({ alignment }: { alignment: Alignment }) {
  const groups = [
    { title: "Why it may interest you", points: alignment.interest, showSources: false },
    { title: "What you bring", points: alignment.background, showSources: false },
    { title: "Strengths demonstrated", points: alignment.strengths, showSources: true },
    { title: "Areas to develop", points: alignment.growth, showSources: true },
  ].map(group => ({ ...group, points: group.points.filter(point => point.text.trim()) }))
    .filter(group => group.points.length > 0);
  return <div className={ws.alignment}>
    {groups.map(group => <section key={group.title}>
      <h3>{group.title}</h3>
      <ul>{group.points.map((point, index) => <li key={index}><p>{point.text}</p></li>)}</ul>
      {group.showSources && <div className={ws.alignmentSources}>{group.points.filter((point, index, all) =>
        all.findIndex(other => other.source === point.source && other.href === point.href) === index
      ).map(point => point.href ? <Link key={point.source} href={point.href}>{point.source}</Link> : <small key={point.source}>{point.source}</small>)}</div>}
    </section>)}
    <div className={ws.alignmentActions}>
      <Link className={ws.textButton} href="/opportunities">Explore jobs →</Link>
    </div>
  </div>;
}

export function RoleAlignment({ roleId, signedOut = false }: { roleId: string; signedOut?: boolean }) {
  const [opened, setOpened] = useState(false);
  const [alignment, setAlignment] = useState<Alignment | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!opened || signedOut) return;
    let active = true;
    async function load() {
      setAlignment(null); setError("");
      try {
        const { data } = await supabaseBrowser().auth.getSession();
        if (!data.session) throw new Error("Sign in again to view your role alignment.");
        const result = await apiCall<{ alignment: Alignment }>(data.session.access_token, `/v1/discovery/alignment/${encodeURIComponent(roleId)}`);
        if (!result || result.alignment.roleId !== roleId) throw new Error("We couldn’t load your role alignment. Please try again.");
        if (active) setAlignment(result.alignment);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "We couldn’t load your role alignment.");
      }
    }
    void load();
    return () => { active = false; };
  }, [opened, roleId, signedOut, retry]);
  return <details className={`${ws.whySuits} ${ws.alignmentRoot}`} onToggle={event => setOpened(event.currentTarget.open)}>
    <summary>Your alignment with this role <span aria-hidden="true">⌄</span></summary>
    {signedOut ? <p><Link href="/welcome?auth=login&next=%2Fdiscover">Sign in</Link> to connect your profile and assessed work to this role.</p>
      : error ? <div role="alert"><p>{error}</p><button className={ws.textButton} onClick={() => setRetry(value => value + 1)}>Try again</button></div>
      : alignment && alignment.roleId === roleId ? <AlignmentContent alignment={alignment} />
      : <p role="status">Loading your role alignment…</p>}
  </details>;
}
