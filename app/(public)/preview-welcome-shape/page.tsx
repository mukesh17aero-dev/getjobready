// Five shapes for the welcome screen. Dead preview page.
//
// Two things are wrong with the one we ship, and they compound:
//
//   1. THE ASK IS ON SHEET ONE. The primary button sits in the hero, so the
//      people who were going to act act there - and the three sheets under
//      it are read by almost nobody. Everything we spent on them is spent on
//      the few who scroll past a button they had already decided about.
//
//   2. WHAT IS UNDER IT IS NOT WRITTEN FOR THE READER. A student's second
//      sheet is the network pitch - "students build verified skills,
//      employers hire on evidence" - which is Ascend describing itself to
//      all three audiences at once. A student scrolling for a reason to stay
//      meets a paragraph about employers.
//
// And a third, quieter: a placement officer gets ONE sheet and then the page
// ends. The tab exists, the story behind it does not.
//
// These are five ways to arrange it. Every option keeps the audience switch
// and keeps the phone deck for students; what changes is where the ask sits
// and who the sheets under it are written for.

export const metadata = { title: "Preview — welcome shapes" };

type Note = { good: string[]; bad: string[] };

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        Five shapes for the welcome screen
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        The button is on the first sheet, so the sheets under it are read by
        almost nobody - and what is under it was written for all three
        audiences at once. These are five ways to arrange the same material.
      </p>

      <section className="mt-6 grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div>
          <h2 className="text-[0.9rem] font-semibold text-amber-900">
            What the page does today
          </h2>
          <p className="mt-1.5 text-[0.86rem] leading-relaxed text-amber-900">
            <strong className="font-semibold">Student:</strong> hero with the
            button → &ldquo;An AI-native talent fulfillment network&rdquo; →
            closing button.{" "}
            <strong className="font-semibold">Employer:</strong> hero with the
            button → the hiring-gap sheet. Then it stops - no closing sheet.{" "}
            <strong className="font-semibold">College:</strong> the hero, and
            nothing else at all.
          </p>
        </div>
        <p className="text-[0.86rem] leading-relaxed text-amber-900">
          So the middle sheet a student reaches is the one place on the page
          that is not about them, and two of the three audiences have no
          ending.
        </p>
      </section>

      <Option
        n={1}
        name="Today"
        line="Ask first, then a sheet about the network, then ask again."
        notes={{
          good: [
            "Somebody already sold acts in the first second",
            "One set of middle sheets to write and maintain",
          ],
          bad: [
            "The sheets below the button are read by almost nobody",
            "A student's second sheet is written for all three audiences",
            "College ends after one sheet; employer has no closing ask",
          ],
        }}
      >
        <Stack
          sheets={[
            { label: "Hero · switch, headline, phone", cta: true },
            { label: "The network — same for everyone", muted: true },
            { label: "Closing ask", cta: true, only: "student only" },
          ]}
        />
      </Option>

      <Option
        n={2}
        name="Earn the ask"
        line="The first sheet makes the case and points down. The button lives at the end."
        notes={{
          good: [
            "Nobody is asked before they have been given a reason",
            "Every sheet is now on the path to the button, so it gets read",
          ],
          bad: [
            "Somebody who arrived ready has to scroll to act",
            "Needs a button in the header to catch them - two asks again",
            "Worst shape on a phone, where scrolling costs the most",
          ],
        }}
      >
        <Stack
          sheets={[
            { label: "Hero · the question, no button" },
            { label: "What you get, in three beats" },
            { label: "Closing ask", cta: true },
          ]}
        />
      </Option>

      <Option
        n={3}
        name="Three stories, one each"
        line="Each audience gets its own middle sheet and its own ending. Nothing is shared but the hero."
        recommended
        notes={{
          good: [
            "Nobody reads a sheet written for somebody else",
            "College and employer stop being dead ends",
            "Keeps the early button for people who are ready",
            "The switch finally changes the page rather than the headline",
          ],
          bad: [
            "Three middle sheets and three endings to write and keep true",
            "The employer and college stories do not exist yet",
          ],
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Stack
            title="Student"
            sheets={[
              { label: "Hero · phone deck", cta: true },
              { label: "The four questions, answered" },
              { label: "Start free", cta: true },
            ]}
          />
          <Stack
            title="Employer"
            sheets={[
              { label: "Hero · the hiring gap", cta: true },
              { label: "What arrives with a candidate" },
              { label: "Talk to us", cta: true },
            ]}
          />
          <Stack
            title="College"
            sheets={[
              { label: "Hero · cohort readiness", cta: true },
              { label: "What a placement cell sees" },
              { label: "Book a walkthrough", cta: true },
            ]}
          />
        </div>
      </Option>

      <Option
        n={4}
        name="One screen, no scroll"
        line="Everything the page needs to say, on the first sheet. The rest is deleted."
        notes={{
          good: [
            "Matches what actually happens - almost nobody scrolls past the button",
            "Fastest on a phone and on a slow connection",
            "Nothing on the page can be stale, because there is barely any page",
          ],
          bad: [
            "No room to answer 'why should I trust this?'",
            "The phone deck has to shrink or go",
            "Weakest for employers and colleges, who need more before a call",
          ],
        }}
      >
        <Stack
          sheets={[
            {
              label: "Hero · headline, three proof lines, one button",
              cta: true,
              tall: true,
            },
          ]}
        />
      </Option>

      <Option
        n={5}
        name="Ask early, prove below"
        line="Today's first sheet, but everything under it is rewritten for whoever is reading."
        notes={{
          good: [
            "Smallest change: no new sheets, the middle one is rewritten three times",
            "The ready still act in the first second",
            "Fixes the 'not about me' sheet without restructuring the page",
          ],
          bad: [
            "The lower sheets are still read by a minority",
            "Still two asks on the page for a student",
          ],
        }}
      >
        <Stack
          sheets={[
            { label: "Hero · switch, headline, phone", cta: true },
            { label: "Written for the selected audience only" },
            { label: "Closing ask, for all three", cta: true },
          ]}
        />
      </Option>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Three.</strong> The tab switch is
          the promise this page already makes - pick who you are and the page
          is about you - and today it only changes the headline. Three parallel
          stories is that promise kept, and it is the only option that fixes
          the college dead end. Keeping the button in the hero means you lose
          nothing from people who arrived ready.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Five</strong> is three&rsquo;s first
          step if the employer and college copy is not ready to write this week:
          same hero, one rewritten middle sheet per audience, closing sheet
          shared. It buys most of the gain for a third of the writing.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Two</strong> is the classic answer
          and the wrong one here: moving the only button below the fold on a
          phone-first product costs more than the sheets are worth.{" "}
          <strong className="font-semibold">Four</strong> is worth keeping in
          mind as the honest floor - if the middle sheets stay unread and
          unwritten-for, they are decoration, and decoration is better deleted
          than maintained.
        </p>
        <p className="mt-3 max-w-2xl text-[0.86rem] leading-relaxed text-slate-500">
          One thing none of these fix: the closing sheet only renders for
          students, so an employer who reads to the bottom is never asked for
          anything. That is a bug in the current page rather than a choice
          between shapes, and it is worth fixing whichever of these you pick.
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

type SheetNote = {
  label: string;
  cta?: boolean;
  muted?: boolean;
  tall?: boolean;
  only?: string;
};

/** The page as a column of sheets, at wireframe scale. */
function Stack({ title, sheets }: { title?: string; sheets: SheetNote[] }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
      {title && (
        <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {title}
        </p>
      )}
      <div className="grid gap-1.5">
        {sheets.map((s) => (
          <div
            key={s.label}
            className={`rounded-md border px-2.5 py-2 ${
              s.tall ? "py-6" : ""
            } ${
              s.muted
                ? "border-dashed border-slate-300 bg-surface"
                : "border-slate-300 bg-surface"
            }`}
          >
            <p
              className={`text-[0.7rem] font-semibold leading-snug ${
                s.muted ? "text-slate-400" : "text-slate-700"
              }`}
            >
              {s.label}
            </p>
            {s.only && (
              <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-amber-700">
                {s.only}
              </p>
            )}
            {s.cta && (
              <span className="mt-1.5 inline-flex h-5 items-center rounded-md bg-brand-violet px-2 text-[0.62rem] font-bold text-white">
                Button
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
