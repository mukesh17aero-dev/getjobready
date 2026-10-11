"use client";

import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

/** The signed-in admin's access token, read fresh for each request. */
export function useAdminToken() {
  return useCallback(async () => {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }, []);
}
