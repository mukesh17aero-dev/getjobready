import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));

const { shareConsequence } = await import("@/features/passport");

describe("creating a passport link asks first, and says what it does", () => {
  it("names what is exposed, that it is frozen, how long it lasts and that it can be revoked", () => {
    const text = shareConsequence(30);
    expect(text).toContain("Anyone with the link");
    expect(text).toContain("as it is right now");
    expect(text).toContain("without the ones you have hidden");
    expect(text).toContain("will not appear");
    expect(text).toContain("30 days");
    expect(text).toContain("until you revoke it");
  });

  it("states the lifetime the backend sent, not a number typed into the sentence", () => {
    expect(shareConsequence(7)).toContain("7 days");
    expect(shareConsequence(1)).toContain("1 day,");
  });

  it("opens the confirmation from the share button instead of creating the link", () => {
    const src = readFileSync("features/passport/passport-share.tsx", "utf8");
    // The button only opens the dialog; the dialog's confirm is what calls share().
    expect(src).toMatch(/onClick=\{\(\) => setConfirmingShare\(true\)\}/);
    expect(src).not.toMatch(/onClick=\{\(\) => void share\(\)\}/);
    expect(src).toMatch(/confirmingShare && \(\s*<ConfirmDialog[\s\S]*?onConfirm=\{\(\) => void share\(\)\}/);
  });
});
