import { afterEach, describe, expect, it, vi } from "vitest";
import { exclusivePanel } from "@/lib/exclusive-panel";

afterEach(() => {
  const owner = exclusivePanel.getSnapshot();
  if (owner) exclusivePanel.dismiss(owner);
});

describe("exclusive panel ownership", () => {
  it("switches ownership in both directions for the latest interaction", () => {
    exclusivePanel.activate("product");
    exclusivePanel.activate("resume");
    expect(exclusivePanel.getSnapshot()).toBe("resume");
    exclusivePanel.activate("product");
    expect(exclusivePanel.getSnapshot()).toBe("product");
  });

  it("ignores late leave and unmount events from the previous panel", () => {
    exclusivePanel.activate("resume");
    exclusivePanel.activate("product");
    exclusivePanel.dismiss("resume");
    expect(exclusivePanel.getSnapshot()).toBe("product");
    exclusivePanel.dismiss("product");
    expect(exclusivePanel.getSnapshot()).toBeNull();
  });

  it("notifies both consumers once per ownership change", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = exclusivePanel.subscribe(first);
    const unsubscribeSecond = exclusivePanel.subscribe(second);
    exclusivePanel.activate("product");
    exclusivePanel.activate("product");
    exclusivePanel.activate("resume");
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    unsubscribeFirst();
    unsubscribeSecond();
  });
});
