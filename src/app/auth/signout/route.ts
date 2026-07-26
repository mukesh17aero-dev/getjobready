import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Failed to sign out:", error.message);
  }
  // 303 (not the 307 default), so the browser's follow-up request to
  // /login is a GET, not a re-issued POST — a plain page route only
  // supports GET/HEAD and would 405 on a preserved-method redirect.
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
