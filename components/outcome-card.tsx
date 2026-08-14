// The plan-card body shared by every "choose an outcome" surface (the
// Outcome Router and the tools hub) so the same three facts appear in the
// same order everywhere: what you get, how long, what it costs.

export type OutcomeFacts = {
  title: string;
  need: string;
  output: string;
  time: string;
  price: string;
};

// Each fact is its own row with a hairline above it: label in a fixed column,
// answer beside it, so the three facts line up across every card in the grid
// and can be compared by scanning down rather than reading.
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[3.9rem_1fr] gap-x-2.5 border-t border-slate-100 py-2 first:border-t-0">
      <span className="pt-px text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
        {label}
      </span>
      <span className="text-slate-700">{children}</span>
    </li>
  );
}

export function OutcomeCardBody({
  facts,
  // A button may not contain a heading (invalid HTML), so selectable cards
  // pass "span"; link cards pass "h2".
  titleTag = "h2",
  footer,
}: {
  facts: OutcomeFacts;
  titleTag?: "h2" | "span";
  footer?: React.ReactNode;
}) {
  const Title = titleTag;
  const free = facts.price.toLowerCase().startsWith("free");

  return (
    <>
      <Title className="block text-base font-semibold tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-brand-violet-deep motion-reduce:transition-none">
        {facts.title}
      </Title>
      <p className="text-[0.85rem] leading-snug text-slate-500">{facts.need}</p>

      <ul className="mt-1.5 text-[0.8rem] leading-snug">
        <Fact label="You get">{facts.output}</Fact>
        <Fact label="Time">{facts.time}</Fact>
        <Fact label="Cost">
          <span className={free ? "text-brand-teal-deep" : "text-amber-700"}>
            {facts.price}
          </span>
        </Fact>
      </ul>

      {footer}
    </>
  );
}

// Motion is an affordance here, not decoration: the card lifts towards the
// pointer, its arrow leans into the direction of travel, and the whole thing
// settles rather than snapping. All of it collapses under reduced-motion.
export const CARD_BASE =
  "group relative flex flex-col gap-1.5 rounded-xl border bg-surface p-4 text-left sm:p-5 " +
  "transition-[transform,box-shadow,border-color] duration-200 ease-out will-change-transform " +
  "hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:duration-75 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0";
