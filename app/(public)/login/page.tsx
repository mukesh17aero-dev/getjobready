import { redirect } from "next/navigation";

// The standalone auth pages are gone: signing in happens in the landing's
// dialog. Deep links (and every ?next= flow in the app) land here first,
// so this forwards them into the dialog with the destination preserved.
export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(`/welcome?auth=login${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}
