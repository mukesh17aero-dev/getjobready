import { richBlocks } from "@/lib/rich-text";

// Written text, rendered: paragraphs, bullet lists and tables.
//
// One renderer for the scene brief, the assistant's replies and the discovery
// assistant, because they are the same problem and two copies of it drift -
// the second one grows table support a month after the first, and only one of
// the two screens ever gets it.
//
// The table scrolls inside its own frame. A five-column table of numbers does
// not fit 360px and never will, and the alternative to a scrollbar here is a
// page that scrolls sideways, which breaks every other column on the screen.

export function RichText({
  text,
  className,
}: {
  text: string;
  /** Applied to the wrapper, so spacing stays the caller's decision. */
  className?: string;
}) {
  const blocks = richBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const gap = i > 0 ? "mt-2" : "";
        if (block.kind === "list") {
          return (
            <ul key={i} className={`grid gap-1 ${gap}`}>
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="text-slate-500">
                    &#8226;
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "table") {
          return (
            <div key={i} className={`overflow-x-auto ${gap ? "mt-3" : ""}`}>
              <table className="w-full min-w-max border-collapse text-left text-[0.84rem]">
                <thead>
                  <tr>
                    {block.head.map((h, j) => (
                      <th
                        key={j}
                        scope="col"
                        className="border-b border-slate-300 px-3 py-1.5 font-semibold text-slate-900 first:pl-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        // The first column is the row's name, so it reads as a
                        // heading rather than as another number.
                        <td
                          key={c}
                          className={`border-b border-slate-100 px-3 py-1.5 first:pl-0 ${
                            c === 0
                              ? "font-medium text-slate-700"
                              : "tabular-nums text-slate-600"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={i} className={gap}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
