// Turning the plain text a model writes into blocks a page can render.
//
// Three things arrive in that text and only three, because these are the three
// a model reaches for unprompted: paragraphs, bullet lists, and pipe tables.
// Anything else - bold, links, headings - is left as the characters it was
// written with rather than half-parsed, because a formatter that handles four
// things out of ten produces text with stray asterisks in it, which reads worse
// than text with none.
//
// No markdown library. The stack forbids adding one, and the reason holds up
// here: a general parser brings a sanitiser, an AST and a plugin system to
// solve a problem that is one pass over an array of lines.
//
// A table matters more than it looks. A scene that says "here is the week's
// health data" and then lists eighteen numbers as pipe-separated prose is
// unreadable, and reading data is one of the three things the assessment sets
// out to measure - so a table rendered as raw pipes measures patience instead.

export type RichBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] };

const BULLET = /^([-*•]|\d+[.)])\s+/;

/** The cells of one row, with the outer pipes taken off. */
function cellsOf(line: string): string[] {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|")) l = l.slice(0, -1);
  return l.split("|").map((c) => c.trim());
}

/** The `|---|:--:|` line that turns the row above it into a header. */
function isDivider(line: string): boolean {
  if (!line.includes("-")) return false;
  const cells = cellsOf(line);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}

/**
 * Split written text into renderable blocks.
 *
 * Blank lines separate blocks, which is what a model does anyway and what
 * makes a table findable: markdown tables never contain one, so a table is
 * always wholly inside a single chunk.
 */
export function richBlocks(text: string): RichBlock[] {
  const chunks = text
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  const out: RichBlock[] = [];
  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    // A table: a row of pipes, then a divider, then rows until they run out.
    if (lines.length >= 2 && lines[0]!.includes("|") && isDivider(lines[1]!)) {
      const head = cellsOf(lines[0]!);
      const rows = lines
        .slice(2)
        .filter((l) => l.includes("|"))
        .map((l) => {
          const cells = cellsOf(l);
          // Square it off against the header. A short row leaves empty cells
          // rather than a ragged table; a long one keeps its extras rather
          // than dropping a number somebody may need.
          while (cells.length < head.length) cells.push("");
          return cells;
        });
      // A header and a rule and nothing under them is not a table worth
      // drawing - fall through and let it render as the text it was.
      if (rows.length > 0) {
        out.push({ kind: "table", head, rows });
        continue;
      }
    }

    if (lines.length > 1 && lines.every((l) => BULLET.test(l))) {
      out.push({
        kind: "list",
        items: lines.map((l) => l.replace(BULLET, "")),
      });
      continue;
    }

    // Wrapped prose is one paragraph: a model breaking a sentence over two
    // lines does not mean two paragraphs, and rendering it as two puts a gap
    // in the middle of a sentence.
    out.push({ kind: "paragraph", text: lines.join(" ") });
  }
  return out;
}
