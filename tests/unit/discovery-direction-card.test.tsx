// The direction card's four controls.
//
// They sit in one column in descending weight, and the order is the point:
// the readiness check, the role page, why it was recommended, and last the
// one that takes the choice back. Written as a test because the card only
// renders for somebody who has chosen or been recommended a direction, so a
// signed-out browser never shows it and a regression here is invisible.

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RoleList } from "@/features/discovery";

const ROLE = {
  id: "customer_success_associate",
  title: "Customer Success Associate",
  world: "Customer operations",
  summary: "Keep customers working, and keep them.",
  glimpse: "Talking to customers",
  mix: [],
  pay: null,
} as unknown as Parameters<typeof RoleList>[0]["roles"][number];

function render(extra: Partial<Parameters<typeof RoleList>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(RoleList, {
      roles: [ROLE],
      recommended: null,
      chosenRoleId: ROLE.id,
      choosing: false,
      compareIds: [],
      onOpen: () => {},
      onChoose: () => {},
      onToggleCompare: () => {},
      onTour: () => {},
      onBack: () => {},
      ...extra,
    } as Parameters<typeof RoleList>[0]),
  );
}

describe("the direction card's controls", () => {
  it("asks why only once, on the left, never beside the buttons", () => {
    const html = render({ ...recommended(), onUnchoose: () => {} });
    expect(html).toContain("Your alignment with this role");
    expect(html).not.toContain("Why this role fits you");
    expect(html.split("Your alignment with this role")).toHaveLength(2);
  });

  it("keeps the readiness check, the role page and the undo in that order", () => {
    const html = render({ onUnchoose: () => {} });
    const readiness = html.indexOf("See practice options");
    const open = html.indexOf("Open the role");
    const unselect = html.indexOf("Unselect this direction");
    expect(readiness).toBeGreaterThan(-1);
    expect(readiness).toBeLessThan(open);
    expect(open).toBeLessThan(unselect);
  });

  const recommended = (uncertainty: string | null = null) => ({
    chosenRoleId: null,
    recommended: [
      {
        roleId: ROLE.id,
        title: ROLE.title,
        why: ["You toured it twice.", "You asked what it pays.", "You compared it with two others."],
        band: "strong" as const,
        score: 0.8,
        uncertainty,
      },
    ],
  });

  it("explains itself by what they told us, folded away", () => {
    const html = render({ ...recommended(), industriesPicked: 3 });
    expect(html).toContain("Your alignment with this role");
    expect(html).not.toContain("skills and aims on your profile");
    expect(html).not.toContain("STRONG FIT");
    // Closed until asked for: the card leads with the role, not the audit.
    expect(html).toMatch(/<details[^>]*>(?![^]*\bopen\b)/);
  });

  it("never reads its behavioural signals back to the person", () => {
    // The engine ranks on how long a page was open, how often somebody came
    // back and what they compared. Those decide the order and stay on the
    // server; a card that recites them is the product watching somebody.
    const html = render({
      chosenRoleId: null,
      recommended: [
        {
          roleId: ROLE.id,
          title: ROLE.title,
          why: [
            "You read this one properly rather than skimming it.",
            "You came back to it more than once.",
            "You put it side by side with another role.",
            "You took the walk-through on this one.",
          ],
          band: "strong" as const,
          score: 0.8,
          uncertainty: null,
        },
      ],
    });
    for (const watched of ["read this one properly", "came back to it", "side by side", "walk-through on this one"]) {
      expect(html, `${watched} was read back to them`).not.toContain(watched);
    }
    expect(html).not.toMatch(/\d+\s*seconds?/i);
    expect(html).not.toMatch(/\b\d+\s+times\b/i);
  });

  it("does not expose score comparisons from ranking caveats", () => {
    expect(render(recommended("Two roles scored within a point of each other."))).not.toContain(
      "Two roles scored within a point of each other.",
    );
  });

  it("never puts a confidence word on a direction", () => {
    // A word like "high" beside a role reads as a measurement of the person.
    const chosen = render({ onUnchoose: () => {} });
    expect(chosen).toContain("Your alignment with this role");
    expect(chosen).not.toContain("Confidence:");
    expect(render(recommended())).not.toContain("Confidence:");
  });
});

it("keeps the role count and clear button out of the search row, so typing never resizes the search box", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("features/discovery/discovery-browse.tsx", "utf8");
  const bar = src.slice(src.indexOf("className={ws.filterbar}"), src.indexOf("className={ws.resultLine}"));
  expect(bar).not.toContain("list.length");
  expect(bar).not.toContain("Clear all filters");
  expect(src).toMatch(/className=\{ws\.resultLine\}><small>\{list\.length\}/);
});

it("highlights the whole search box on focus, with no second ring on the field inside, and keeps it narrow", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync("features/discovery/discovery-workspace.module.css", "utf8");
  expect(css).toContain(".frame .search input:focus-visible{outline:none;box-shadow:none}");
  expect(css).toMatch(/\.search:focus-within\{border-color:var\(--accent\);box-shadow:/);
  expect(css).toContain(".frame .search{max-width:420px}");
});

it("uses dropdowns that open below their button, at a fixed width, with long lists scrolling", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("features/discovery/discovery-browse.tsx", "utf8");
  expect(src).not.toContain("<select");
  expect(src.match(/<Picker label="(Industry|Experience level)"/g)).toHaveLength(2);
  expect(readFileSync("components/ui/picker.tsx", "utf8")).toContain("absolute left-0 top-full z-30 mt-1.5 max-h-72 w-full overflow-y-auto");
  expect(readFileSync("features/discovery/discovery-workspace.module.css", "utf8")).toContain(".frame .filterField{flex:0 0 240px}");
});
