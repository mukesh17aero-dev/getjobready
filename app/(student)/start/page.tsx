import { redirect } from "next/navigation";

// The router lives at "/" now: it is the first thing a signed-in person sees,
// so it is the home page rather than a place you navigate to. This keeps every
// existing link and bookmark working.

export default function StartPage() {
  redirect("/");
}
