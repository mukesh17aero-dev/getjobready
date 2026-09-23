// Where "back" goes.
//
// Client-side navigation does not update document.referrer, so the hubs record
// themselves. Two things matter: an unknown path must never be remembered (or
// the back link sends somebody somewhere that is not a hub), and storage being
// unavailable must degrade rather than throw — a private window would
// otherwise break every page with a back link on it.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HUB_LABELS, readHub, rememberHub } from "@/lib/hub-memory";

const store = new Map<string, string>();
const workingStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

const useStorage = (impl: unknown) =>
  vi.stubGlobal("sessionStorage", impl as Storage);

beforeEach(() => {
  store.clear();
  useStorage(workingStorage);
});
afterEach(() => vi.unstubAllGlobals());

describe("remembering which hub somebody came from", () => {
  it("remembers a real hub and reads it back", () => {
    rememberHub("/practice");
    expect(readHub()).toBe("/practice");
  });

  it("refuses a path that is not a hub", () => {
    rememberHub("/practice/readiness/results");
    expect(readHub()).toBeNull();
  });

  it("refuses a path that only looks like one", () => {
    rememberHub("https://example.com/practice");
    expect(readHub()).toBeNull();
  });

  it("keeps the most recent hub, not the first", () => {
    rememberHub("/discover");
    rememberHub("/resume");
    expect(readHub()).toBe("/resume");
  });

  it("returns null when a stored value is no longer a hub", () => {
    store.set("ascend:last-hub", "/retired-hub");
    expect(readHub()).toBeNull();
  });
});

describe("when the browser will not store anything", () => {
  const throwing = {
    getItem: () => { throw new Error("storage disabled"); },
    setItem: () => { throw new Error("storage disabled"); },
  };

  it("does not throw when remembering", () => {
    useStorage(throwing);
    expect(() => rememberHub("/practice")).not.toThrow();
  });

  it("reads as no hub rather than throwing", () => {
    useStorage(throwing);
    expect(readHub()).toBeNull();
  });
});

describe("the hub labels", () => {
  it("names every hub a module page can be reached through", () => {
    // Both the resume and the profile list the Professional Profile Builder,
    // so both must be here or a back link is wrong for half its visitors.
    expect(Object.keys(HUB_LABELS).sort())
      .toEqual(["/discover", "/interview", "/practice", "/profile", "/resume", "/start"]);
  });

  it("gives every hub a label that reads as a way back", () => {
    for (const [path, label] of Object.entries(HUB_LABELS)) {
      expect(label, path).toMatch(/^Back to /);
    }
  });
});
