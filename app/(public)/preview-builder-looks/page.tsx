// Five ways to lay out the resume builder and the profile builder. Dead
// preview page.
//
// Both pages are the same shape today: controls on the left, a live document
// on the right. That shape is right for the person who has already built one
// and is now adjusting it - and it is the wrong first impression, for one
// reason above all others:
//
//   ON ARRIVAL THE RIGHT-HAND HALF IS NOT THEIRS. It is empty, or it is a
//   worked example belonging to somebody called Anjali. So the first thing a
//   new person sees is half a screen of something that is not about them,
//   beside a column of questions. Nothing on the page says "start here", and
//   the split implies the two halves are equally important when one of them
//   cannot do anything yet.
//
// The other two costs are quieter. At 360px the two columns stack, so the
// preview lands under the form and is never seen while typing - the whole
// argument for the split is gone on the device most people use. And a live
// preview of a mostly-empty document teaches somebody that their resume is
// thin before they have been asked anything.
//
// What follows is the same content in five arrangements. Every option below
// keeps Scribe and keeps the real document; what changes is what somebody
// meets first and how much of the screen the unfinished half is given.

export const metadata = { title: "Preview — builder looks" };

type Note = { good: string[]; bad: string[] };

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        Five ways to lay out the two builders
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        The resume builder and the LinkedIn Profile Builder are the same
        shape: controls left, live document right. These are five alternatives
        to that, with what each one costs.
      </p>

      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-[0.9rem] font-semibold text-amber-900">
          What is actually wrong with the split
        </h2>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-amber-900">
          On arrival the right-hand half is not theirs. It is empty, or it is a
          worked example belonging to somebody else. So a new person meets half
          a screen that is not about them, beside a column of questions, with
          nothing saying where to start. Below 640px the columns stack anyway,
          so the preview sits under the form and is never seen while typing.
        </p>
      </section>

      <Option
        n={1}
        name="Today — side by side"
        line="Controls left, live document right, from the first frame."
        notes={{
          good: [
            "Every change is visible immediately",
            "Right for somebody adjusting a finished resume",
          ],
          bad: [
            "The document is empty or somebody else's on arrival",
            "Stacks on mobile, so the preview is never seen while typing",
            "No single starting point",
          ],
        }}
      >
        <Split
          left={[<Field key="a" label="What are we building?" filled />, <Field key="b" label="Your details" />, <Field key="c" label="Experience" />]}
          right={<Sheet label="Preview · empty" faint />}
        />
      </Option>

      <Option
        n={2}
        name="One thing at a time"
        line="Full width, one question per step. The document arrives at the end."
        notes={{
          good: [
            "Impossible to be unsure what to do next",
            "Identical on a phone and a laptop",
            "Nothing half-built is ever on screen",
          ],
          bad: [
            "Slower for somebody who has done it before",
            "Hides the thing they came to make until the end",
          ],
        }}
      >
        <Frame>
          <Bar>Step 2 of 4 · Your experience</Bar>
          <div className="mx-auto max-w-md">
            <Field label="Where have you worked?" filled />
            <Field label="What did you do there?" />
            <Button>Continue</Button>
          </div>
        </Frame>
      </Option>

      <Option
        n={3}
        name="Document-led"
        line="The resume is the page. Click any part of it to change that part."
        notes={{
          good: [
            "Reads as 'this is your resume', not 'this is a form'",
            "The thing being made is always the biggest thing on screen",
            "No empty second column",
          ],
          bad: [
            "Needs something on the page first, so it cannot be the very first screen",
            "Every section needs its own editor",
          ],
        }}
      >
        <Frame>
          <Bar>Your resume · click any section to change it</Bar>
          <div className="mx-auto max-w-sm">
            <Sheet label="Priya Sharma" editable />
          </div>
        </Frame>
      </Option>

      <Option
        n={4}
        name="Scribe-led"
        line="Ask for what you want in plain words. The document updates underneath."
        notes={{
          good: [
            "One input instead of a form",
            "The profile builder already works this way after the first draft",
          ],
          bad: [
            "A blank chat box is its own kind of 'what do I type here'",
            "Slower than a form for facts like dates and job titles",
          ],
        }}
      >
        <Frame>
          <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-[0.72rem] text-slate-600">
              Make the summary shorter and mention the shop job
            </div>
            <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-[0.72rem] text-slate-500">
              Done. I cut it to three lines and moved the shop job up.
            </div>
            <Sheet label="Priya Sharma" small />
          </div>
        </Frame>
      </Option>

      <Option
        n={5}
        name="Form first, then side by side"
        line="One column until there is a document. The split appears when it has something to show."
        recommended
        notes={{
          good: [
            "The empty second column never exists",
            "New person gets a clear single path; returning person gets the split",
            "No new editors to build - it is today's screen, held back",
          ],
          bad: [
            "The layout changes once, which has to be handled gently",
          ],
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Frame>
            <Bar>Before · one column</Bar>
            <div className="mx-auto max-w-[13rem]">
              <Field label="What are we building?" filled />
              <Field label="Your details" />
              <Button>Build it</Button>
            </div>
          </Frame>
          <Frame>
            <Bar>After · the split</Bar>
            <Split
              left={[<Field key="a" label="Change anything" filled />]}
              right={<Sheet label="Priya Sharma" />}
            />
          </Frame>
        </div>
      </Option>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Five.</strong> It fixes the actual
          complaint — the half-screen that is not yours — without giving up the
          live preview, and without building any new editors. It is today&apos;s
          screen with the split held back until it has something to show. One
          conditional class, not a rewrite.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Three</strong> is the better screen
          if you are willing to spend on it. Making the document the page is the
          strongest possible answer to &ldquo;what is this?&rdquo;, and it is
          how the tools people already use behave. It needs an editor per
          section, so it is a fortnight rather than an afternoon.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Two</strong> is the safest for a
          first-time user and the most frustrating for everybody else, and{" "}
          <strong className="font-semibold">four</strong> only works once
          something exists to talk about — which is why the profile builder
          already uses it second rather than first.
        </p>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- pieces */

function Option({
  n,
  name,
  line,
  notes,
  recommended,
  children,
}: {
  n: number;
  name: string;
  line: string;
  notes: Note;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-900">
          {n}. {name}
        </h2>
        {recommended && (
          <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-wide text-brand-teal-deep dark:text-brand-teal-soft">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-1 text-[0.88rem] text-slate-600">{line}</p>
      <div className="mt-3">{children}</div>
      <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <Notes title="Gains" items={notes.good} tone="good" />
        <Notes title="Costs" items={notes.bad} tone="bad" />
      </div>
    </section>
  );
}

function Notes({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        {title}
      </p>
      <ul className="mt-1 grid gap-1 text-[0.84rem] leading-snug text-slate-600">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className={tone === "good" ? "text-brand-teal" : "text-slate-300"}
            >
              {tone === "good" ? "+" : "−"}
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50 p-3">
      {children}
    </div>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
      {children}
    </p>
  );
}

function Split({
  left,
  right,
}: {
  left: React.ReactNode[];
  right: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-3">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function Field({ label, filled }: { label: string; filled?: boolean }) {
  return (
    <div className="mb-2">
      <p className="text-[0.66rem] font-semibold text-slate-500">{label}</p>
      <div
        className={`mt-1 h-6 rounded-md border ${
          filled
            ? "border-brand-teal/50 bg-brand-teal/10"
            : "border-slate-300 bg-surface"
        }`}
      />
    </div>
  );
}

function Button({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 inline-flex h-7 items-center rounded-md bg-brand-violet px-3 text-[0.7rem] font-bold text-white">
      {children}
    </div>
  );
}

/** A resume sheet, at wireframe scale. */
function Sheet({
  label,
  faint,
  editable,
  small,
}: {
  label: string;
  faint?: boolean;
  editable?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-md border bg-surface p-2 ${small ? "mt-2" : ""} ${
        faint ? "border-dashed border-slate-300 opacity-50" : "border-slate-300"
      }`}
    >
      <p className="text-[0.66rem] font-bold text-slate-700">{label}</p>
      <div className="mt-1.5 grid gap-1">
        {[90, 70, 80, 60, 75].map((w, i) => (
          <div
            key={i}
            style={{ width: `${w}%` }}
            className={`h-1.5 rounded-full ${
              editable && i === 1 ? "bg-brand-teal/40" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      {editable && (
        <p className="mt-1.5 text-[0.6rem] text-brand-teal-deep dark:text-brand-teal-soft">
          click to edit this section
        </p>
      )}
    </div>
  );
}
