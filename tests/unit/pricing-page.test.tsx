import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "@/app/(student)/pricing/page";

const api = vi.hoisted(() => ({ getPricing: vi.fn() }));
vi.mock("@/lib/api", () => api);
vi.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }) }));

beforeEach(() => vi.clearAllMocks());

async function render() {
  return renderToStaticMarkup(await Page());
}

describe("pricing page", () => {
  it("shows a friendly outage message rather than a blank page when pricing fails to load", async () => {
    api.getPricing.mockResolvedValue(null);
    const html = await render();
    expect(html).toContain("could not load");
  });

  it("shows every product with a real rupee price and a buy button", async () => {
    api.getPricing.mockResolvedValue({
      products: [
        { product: "resume", amountPaise: 49900, currency: "INR" },
        { product: "full_journey", amountPaise: 299900, currency: "INR" },
      ],
    });
    const html = await render();
    expect(html).toContain("Resume Studio");
    expect(html).toContain("₹499");
    expect(html).toContain("Full Journey");
    expect(html).toContain("₹2,999");
    expect(html).toContain("Buy Resume Studio");
  });

  it("falls back to the raw product id rather than hiding an unknown product", async () => {
    api.getPricing.mockResolvedValue({ products: [{ product: "mystery_product", amountPaise: 100, currency: "INR" }] });
    const html = await render();
    expect(html).toContain("mystery_product");
  });
});
