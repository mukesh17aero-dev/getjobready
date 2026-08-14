import type { RoleBrief as Brief } from "@/lib/api";

// The personal read-out under a match: why this work suits the person reading
// it, and how they could be good at it quickly.
//
// Three parts in a fixed order, because that is the order the questions arrive
// in someone's head — is this me, could I do it, what will be hard. The last
// part is never omitted when it exists: a read-out with no difficulty in it
// reads as a sales pitch, and stops being believable.

function Points({ items }: { items: Brief["fit"] }) {
  return (
    <ul className="mt-2 grid gap-2">
      {items.map((item) => (
        <li
          key={item.point}
          className="border-l-2 border-brand-violet/35 pl-3 text-[0.9rem] leading-relaxed text-slate-700"
        >
          {item.point}
        </li>
      ))}
    </ul>
  );
}

function Steps({
  items,
  tone,
}: {
  items: Brief["excel"];
  tone: "teal" | "amber";
}) {
  return (
    <ul className="mt-2 grid gap-2.5">
      {items.map((item) => (
        <li key={item.title}>
          <p
            className={`text-[0.82rem] font-semibold ${
              tone === "teal" ? "text-brand-teal-deep" : "text-amber-800"
            }`}
          >
            {item.title}
          </p>
          <p className="mt-0.5 text-[0.9rem] leading-relaxed text-slate-700">
            {item.how}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </h4>
  );
}

export function RoleBrief({ brief }: { brief: Brief; title?: string }) {
  return (
    <div className="grid gap-4 border-t border-slate-100 pt-3.5">
      <section>
        {/* The summary above already says "why this suits you", so this names
            what the reasoning rests on instead of repeating the question. */}
        <Heading>What your answers showed</Heading>
        <Points items={brief.fit} />
      </section>

      {brief.excel.length > 0 && (
        <section>
          <Heading>How you&apos;d get good at it fast</Heading>
          <Steps items={brief.excel} tone="teal" />
        </section>
      )}

      {brief.watch.length > 0 && (
        <section>
          <Heading>What will be hard</Heading>
          <Steps items={brief.watch} tone="amber" />
        </section>
      )}

      <p className="text-[0.72rem] leading-snug text-slate-400">
        Written from your own answers and the words on your profile — not from
        anything we assumed about you.
      </p>
    </div>
  );
}
