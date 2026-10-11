"use client";

import { useEffect, useState } from "react";
import { collegeAccess } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Whether the signed-in account belongs to a college partner, so the account
 * menu can offer the cohort portal to them and to nobody else. Asked of the
 * API once per page load, like the admin check: membership is never read from
 * the token, and the portal itself refuses anyone who is not a member.
 */
export function useIsCollegeMember(signedIn: boolean): boolean {
  const [member, setMember] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    void supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        return token ? collegeAccess(token) : null;
      })
      .then((access) => { if (live) setMember(access?.isMember ?? false); });
    return () => { live = false; };
  }, [signedIn]);
  // Derived, so signing out is answered here rather than by a second setState.
  return signedIn ? member : false;
}
