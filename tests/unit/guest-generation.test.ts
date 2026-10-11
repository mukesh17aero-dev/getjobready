import { afterEach, describe, expect, it, vi } from "vitest";
import { generateCall } from "@/lib/api/core";

afterEach(() => vi.unstubAllGlobals());
describe("generation authentication boundary", () => {
  it.each(["", "   "])("does not send an AI request for a missing token", async token => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const result = await generateCall(token, "/v1/assessment/preview/role/assist", { question: "Help" });
    expect(result.ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps authenticated generation working", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, reply: "Answer" }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(await generateCall("signed-in-token", "/v1/discovery/ask", { question: "Help" })).toEqual({ ok: true, reply: "Answer" });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer signed-in-token" }) }));
  });
});
