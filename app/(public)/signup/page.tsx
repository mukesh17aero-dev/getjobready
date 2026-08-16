import { redirect } from "next/navigation";

export default async function SignupRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(`/welcome?auth=signup${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}
