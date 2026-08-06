"use client";

import { useEffect, useState } from "react";
import { checkApi, checkDb, type DbStatus } from "@/lib/api";

type Check = "checking" | "ok" | "down";

function Chip({ label, state }: { label: string; state: Check }) {
  const dot =
    state === "ok"
      ? "bg-teal-500"
      : state === "down"
        ? "bg-rose-500"
        : "bg-slate-300 animate-pulse motion-reduce:animate-none";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
      <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
      <span className="sr-only">
        {state === "ok" ? "connected" : state === "down" ? "unreachable" : "checking"}
      </span>
    </span>
  );
}

// Live wiring proof: this page (Vercel) → backend API (Render) → database
// (Supabase). Purely informational; nothing on the page depends on it.
export function StatusStrip() {
  const [api, setApi] = useState<Check>("checking");
  const [db, setDb] = useState<Check>("checking");
  const [dbDetail, setDbDetail] = useState<DbStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const apiOk = await checkApi();
      if (cancelled) return;
      setApi(apiOk ? "ok" : "down");
      const dbState = await checkDb();
      if (cancelled) return;
      setDbDetail(dbState);
      setDb(dbState === "connected" ? "ok" : "down");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip label="Frontend" state="ok" />
      <Chip label="Backend API" state={api} />
      <Chip
        label={dbDetail === "not_configured" ? "Database (not configured)" : "Database"}
        state={db}
      />
      {(api === "checking" || db === "checking") && (
        <span className="text-xs text-slate-400">
          First check can take up to a minute while the backend wakes up.
        </span>
      )}
    </div>
  );
}
