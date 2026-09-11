import { redirect } from "next/navigation";

// There is no separate assessment destination any more - readiness now lives
// inside Practice, as the first of its three cards.
//
// This stays because the journey route's `landing` value is supplied by the
// backend, which still points at /readiness, and a bookmark or a stale API
// response should not 404 over that. Delete once ascend-backend returns
// /practice for the readiness route.

export default function ReadinessRedirect() {
  redirect("/practice");
}
