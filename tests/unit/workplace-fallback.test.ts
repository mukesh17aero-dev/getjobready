import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// The 3D tour runs in an iframe and the page around it cannot see whether it
// drew anything. These pin the one channel that tells it, so an empty stage
// never sits beside the text again.
const scene = readFileSync("public/workplace-tour/scene.js", "utf8");
const host = readFileSync("features/discovery/discovery-workplace.tsx", "utf8");
// Internal to the discovery feature, so read from source rather than widening its barrel.
const TOUR_UNAVAILABLE = host.match(/const TOUR_UNAVAILABLE = "([^"]+)"/)?.[1];

describe("workplace tour fallback", () => {
  it("posts the same message the host listens for", () => {
    expect(TOUR_UNAVAILABLE).toBe("ascend-tour-unavailable");
    expect(host).toContain("=== TOUR_UNAVAILABLE");
    expect(scene).toContain(`postMessage({type:'${TOUR_UNAVAILABLE}'},location.origin)`);
  });

  it("routes every failure path through that one exit", () => {
    expect(scene).toContain("if(!gl){unavailable();return;}");
    expect(scene).toMatch(/webglcontextlost[^;]*;[^;]*;unavailable\(\)/);
    expect(scene).toMatch(/console\.error\('ASCEND role tour:',error\);unavailable\(\)/);
    // No path may reveal the notice on its own any more.
    expect(scene.match(/\$\('fallback'\)\.hidden=false/g)).toHaveLength(1);
  });

  it("accepts the message only from its own frame on its own origin", () => {
    expect(host).toContain("event.origin !== window.location.origin");
    expect(host).toContain("event.source !== frame.current?.contentWindow");
  });

  it("removes the stage instead of leaving it empty", () => {
    expect(host).toMatch(/\{!sceneFailed && <div className="discovery-workplace-stage">/);
  });
});
