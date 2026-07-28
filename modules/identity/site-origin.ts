import { headers } from "next/headers";

/**
 * The absolute origin to build OAuth and password-reset return URLs from.
 *
 * These links leave our server — Google redirects back to one, and the other
 * arrives in someone's inbox — so a relative path is not an option.
 *
 * `NEXT_PUBLIC_SITE_URL` wins when set, because behind Vercel's proxy the
 * request headers describe the edge, not the address the person typed. Falling
 * back to the headers keeps local development working with no configuration.
 */
export async function getSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host ?? "localhost:3000"}`;
}
