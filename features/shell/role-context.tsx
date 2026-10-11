"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJourneyState } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import s from "./product-navigation.module.css";

/** The account-owned direction is shared across tools, including Jobs. */
export function RoleContext({ pathname, accountKey }: { pathname: string; accountKey: string | null }) {
  const [context, setContext] = useState<{ owner: string | null; title: string | null } | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!data.session) return;
      const journey = await getJourneyState(data.session.access_token);
      if (active) setContext({ owner: accountKey, title: journey?.progress?.role?.title ?? null });
    }
    void load().catch(() => {});
    return () => { active = false; };
  }, [pathname, accountKey]);
  const title = accountKey && context?.owner === accountKey ? context.title : null;
  return <div className={s.roleContext}>
    <span>{title ?? "Explore at your own pace"}</span>
    <Link href="/discover">{title ? "Change direction" : "Explore roles"}</Link>
  </div>;
}
