import { describe, expect, it } from "vitest";
import { richBlocks } from "@/lib/rich-text";

// The formatter behind every piece of written text the product renders: scene
// briefs, the in-scene assistant, the discovery assistant. What is tested here
// is the parse, because the parse is where it can be wrong quietly - a table
// that falls back to a paragraph still renders, it just renders as a wall of
// pipes, and nobody notices until somebody has to read numbers out of it.

const TABLE = `Here is the week's health data.

| Metric | Today | Yesterday | Team target |
|--------|-------|-----------|-------------|
| Tickets closed | 18 | 31 | 28 |
| Average handle time (mins) | 4.2 | 4.8 | 5.0 |
| Tickets re-opened | 7 | 2 | <3 |

What would you lead with?`;

describe("richBlocks", () => {
  it("finds a table between two paragraphs", () => {
    const blocks = richBlocks(TABLE);
    expect(blocks.map((b) => b.kind)).toEqual([
      "paragraph",
      "table",
      "paragraph",
    ]);
  });

  it("reads the header and every row", () => {
    const table = richBlocks(TABLE).find((b) => b.kind === "table");
    expect(table).toBeDefined();
    if (table?.kind !== "table") return;
    expect(table.head).toEqual([
      "Metric",
      "Today",
      "Yesterday",
      "Team target",
    ]);
    expect(table.rows).toHaveLength(3);
    expect(table.rows[0]).toEqual(["Tickets closed", "18", "31", "28"]);
    // A cell that looks like markup is a value, not markup.
    expect(table.rows[2]?.[3]).toBe("<3");
  });

  it("squares a short row off against the header", () => {
    const blocks = richBlocks("| A | B | C |\n|---|---|---|\n| 1 | 2 |");
    expect(blocks[0]?.kind).toBe("table");
    if (blocks[0]?.kind !== "table") return;
    expect(blocks[0].rows[0]).toEqual(["1", "2", ""]);
  });

  it("leaves a header and rule with no rows as text", () => {
    // Not a table worth drawing, and drawing an empty one looks like a bug.
    const blocks = richBlocks("| A | B |\n|---|---|");
    expect(blocks[0]?.kind).toBe("paragraph");
  });

  it("does not mistake a sentence with a pipe in it for a table", () => {
    const blocks = richBlocks("Run a | b to pipe it.\nThen read the output.");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "Run a | b to pipe it. Then read the output." },
    ]);
  });

  it("reads a bullet list, whatever it was bulleted with", () => {
    const blocks = richBlocks("- one\n* two\n3) three");
    expect(blocks[0]).toEqual({
      kind: "list",
      items: ["one", "two", "three"],
    });
  });

  it("keeps a wrapped sentence as one paragraph", () => {
    // A model breaking a line does not mean a new paragraph, and rendering it
    // as two puts a gap in the middle of a sentence.
    const blocks = richBlocks("He says he was told five\nbusiness days.");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "He says he was told five business days." },
    ]);
  });

  it("has nothing to say about empty text", () => {
    expect(richBlocks("")).toEqual([]);
    expect(richBlocks("   \n\n  ")).toEqual([]);
  });
});
