import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchAnswer } from "../../lib/integrity-signals";

class Page extends EventTarget { hidden = false; focused = true; hasFocus() { return this.focused; } }
let page: Page;
let browser: EventTarget;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-11T12:00:00Z")); page = new Page(); browser = new EventTarget(); vi.stubGlobal("document", page); vi.stubGlobal("window", browser); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("assessment activity observations", () => {
  it("records one away interval when a tab switch emits both blur and visibility events", () => {
    const onEvent = vi.fn(); const watch = watchAnswer({ onEvent });
    page.focused = false; browser.dispatchEvent(new Event("blur"));
    page.hidden = true; page.dispatchEvent(new Event("visibilitychange"));
    page.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(8000);
    page.hidden = false; page.focused = true; page.dispatchEvent(new Event("visibilitychange")); browser.dispatchEvent(new Event("focus"));
    const result = watch.read(0);
    expect(result.awayCount).toBe(1); expect(result.hiddenCount).toBe(1);
    expect(result.awaySeconds).toBe(8); expect(result.hiddenSeconds).toBe(8);
    expect(result.events.filter(e => e.type === "focus_returned")).toHaveLength(1);
    expect(result.events.at(-1)).toMatchObject({ type: "focus_returned", seconds: 8 }); watch.stop();
  });
  it("records window focus loss even when the tab stays visible", () => {
    const watch = watchAnswer(); page.focused = false; browser.dispatchEvent(new Event("blur")); vi.advanceTimersByTime(3500);
    expect(watch.read(0)).toMatchObject({ awayCount: 1, awaySeconds: 4, hiddenCount: 0, hiddenSeconds: 0 });
    page.focused = true; browser.dispatchEvent(new Event("focus")); watch.stop();
  });
  it("keeps blocked paste attempts separate from pasted authorship", () => {
    const watch = watchAnswer(); watch.block("copy"); watch.block("cut"); watch.block("paste"); watch.block("drop");
    expect(watch.read(12)).toMatchObject({ blockedCopies: 1, blockedCuts: 1, blockedPastes: 1, blockedDrops: 1, pastes: 0, pastedChars: 0, finalChars: 12 }); watch.stop();
  });
  it("restores saved counters, bounds detailed events, and retains an omission count", () => {
    const first = watchAnswer(); first.block("paste"); const initial = first.read(4); first.stop();
    const second = watchAnswer({ initial }); for (let i = 0; i < 105; i++) second.block("copy");
    expect(second.read(4)).toMatchObject({ blockedPastes: 1, blockedCopies: 105, omittedEvents: 6 });
    expect(second.read(4).events).toHaveLength(100); second.stop();
  });
  it("stops observing when the question or assessment closes", () => {
    const onEvent = vi.fn(); const watch = watchAnswer({ onEvent }); watch.stop(); browser.dispatchEvent(new Event("blur"));
    page.hidden = true; page.dispatchEvent(new Event("visibilitychange")); watch.block("paste");
    expect(onEvent).not.toHaveBeenCalled(); expect(watch.read(0).awayCount).toBe(0);
  });
  it("does not manufacture typing evidence for modifier or navigation keys", () => {
    const watch = watchAnswer(); watch.key("Control"); watch.key("ArrowLeft"); expect(watch.read(0).secondsToFirstKey).toBeNull();
    vi.advanceTimersByTime(2000); watch.key("a"); watch.key("Backspace");
    expect(watch.read(0)).toMatchObject({ secondsToFirstKey: 2, keystrokes: 1, deletions: 1 }); watch.stop();
  });
});
