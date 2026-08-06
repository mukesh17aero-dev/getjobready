// The one place the backend URL is known. NEXT_PUBLIC_* must be accessed
// statically so Next.js can inline it into the browser bundle.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function getJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function checkApi(): Promise<boolean> {
  const data = await getJson("/health");
  return data?.status === "ok";
}

export type DbStatus = "connected" | "not_configured" | "unreachable";

export async function checkDb(): Promise<DbStatus> {
  const data = await getJson("/health/db");
  if (!data) return "unreachable";
  return data.database === "connected" ? "connected" : "not_configured";
}
