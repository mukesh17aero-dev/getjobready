import type { Passport, PassportLevel, PassportPage } from "@/lib/api";

// The Passport, as a booklet.
//
// Page one is the data page - photograph, seal, fields in a fixed order, so
// any two passports read the same way. After it, one page per skill, laid out
// like a visa rather than a stamp: the date it was attained, who issued it,
// the score beside what it was measured on, the evidence, and a reference.
//
// The unissued state is not a lesser version of the issued one - it is a
// different document, and it says so on its face. Dashed cover, no seal, the
// word UNISSUED across the data page, and sharing switched off. That state is
// the one most likely to be screenshotted early, so the caveat has to survive
// being cropped.
//
// Nothing self-reported is ever on a page. A page comes from work that was
// watched and marked, and a page resting on one reading says so.

const LEVEL_TONE: Record<PassportLevel, string> = {
  Strong: "border-brand-teal text-teal-800",
  Working: "border-brand-teal/60 text-teal-700",
  Emerging: "border-amber-500/60 text-amber-800",
};

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
/** Same on the server and in the browser - UTC parts, no locale. */
function longDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-1">
      <dt className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </dt>
      <dd className="text-[0.76rem] font-semibold leading-snug text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function Stamp({ page }: { page: PassportPage }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full border-2 border-dashed px-3.5 py-2.5 text-center ${LEVEL_TONE[page.level]} ${
        page.provisional ? "opacity-70" : ""
      }`}
      style={{ transform: "rotate(-6deg)" }}
    >
      <span className="text-[0.52rem] font-bold uppercase tracking-[0.14em]">
        Ascend
      </span>
      <span className="text-[0.78rem] font-bold uppercase leading-tight tracking-wide">
        {page.level}
      </span>
      <span className="text-[0.48rem] font-semibold uppercase tracking-wide opacity-70">
        {longDate(page.attained)}
      </span>
    </span>
  );
}

export function PassportBook({
  passport,
  name,
  photo,
  qualification,
}: {
  passport: Passport;
  name: string;
  photo?: string | null;
  qualification?: string | null;
}) {
  const issued = passport.issuedAt !== null;

  return (
    <div className="mx-auto max-w-lg">
      {/* ---------------------------------------------- the data page */}
      <div
        className={`overflow-hidden rounded-xl bg-[#fdfbf5] ${
          issued ? "border-4 border-brand-panel" : "border-4 border-dashed border-slate-300"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-2 px-4 py-2 ${
            issued ? "bg-brand-panel" : "bg-slate-200"
          }`}
        >
          <p
            className={`text-[0.6rem] font-bold uppercase tracking-[0.28em] ${
              issued ? "text-white/70" : "text-slate-500"
            }`}
          >
            Ascend
          </p>
          <p
            className={`text-[0.6rem] font-bold uppercase tracking-[0.16em] ${
              issued ? "text-brand-teal-soft" : "text-amber-800"
            }`}
          >
            {issued ? `Issued ${longDate(passport.issuedAt!)}` : "Not issued"}
          </p>
        </div>

        <div className="relative flex gap-4 p-4">
          {/* Across the page rather than in a footnote: this is the state most
              likely to be cropped into a screenshot. */}
          {!issued && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center text-[1.5rem] font-bold uppercase tracking-[0.3em] text-slate-900/[0.06]"
              style={{ transform: "rotate(-12deg)" }}
            >
              Unissued
            </span>
          )}

          <div className="relative shrink-0">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                referrerPolicy="no-referrer"
                className="h-24 w-20 rounded-sm object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="grid h-24 w-20 place-items-center rounded-sm bg-slate-200 text-[0.6rem] font-bold uppercase tracking-wide text-slate-500"
              >
                Photo
              </span>
            )}
            <span
              aria-hidden
              className={`mt-2 grid h-12 w-20 place-items-center rounded-full border-2 border-dashed text-[0.45rem] font-bold uppercase leading-tight tracking-widest ${
                issued
                  ? "border-brand-teal/60 text-teal-700"
                  : "border-slate-300 text-slate-400"
              }`}
            >
              {issued ? (
                <>
                  Ascend
                  <br />
                  Verified
                </>
              ) : (
                <>
                  Seal
                  <br />
                  pending
                </>
              )}
            </span>
          </div>

          <dl className="relative grid min-w-0 flex-1 gap-1.5">
            <Field label="Name" value={name} />
            <Field label="Aiming at" value={passport.roleTitle} />
            {qualification && (
              <Field label="Qualification" value={qualification} />
            )}
            <Field label="Chosen" value={longDate(passport.createdAt)} />
            <Field
              label="Skills stamped"
              value={
                passport.pages.length === 0
                  ? "None yet"
                  : `${passport.pages.length} of ${passport.pages.length + passport.blankPages.length}`
              }
            />
            <Field
              label="Status"
              value={issued ? "Issued by Ascend" : "Not issued by Ascend"}
            />
            <Field label="Passport no." value={passport.number} />
          </dl>
        </div>

        <p className="border-t border-slate-200 px-4 py-2 font-mono text-[0.58rem] tracking-[0.06em] text-slate-400">
          {`ASC<<${name.toUpperCase().replace(/\s+/g, "<")}<<${passport.roleTitle
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}<<${passport.number.replace(/-/g, "")}`}
        </p>
      </div>

      {/* --------------------------------------------- what issues it */}
      {!issued && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-amber-900">
            Yours, and empty. That is correct.
          </p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-amber-900">
            Nothing goes in here because you said it. A page comes from work
            that was watched and marked — you chose a role, which is a start and
            is not evidence.
          </p>
          <p className="mt-2 text-[0.83rem] leading-relaxed text-amber-900">
            <strong className="font-semibold">To have it issued:</strong>{" "}
            {passport.issueRule} You are at {passport.towardsIssue}
          </p>
        </div>
      )}

      {/* --------------------------------------------------- the pages */}
      {passport.pages.length > 0 && (
        <div className="mt-3 grid gap-3">
          {passport.pages.map((page, i) => (
            <div
              key={page.skill}
              className={`overflow-hidden rounded-xl bg-[#fdfbf5] ${
                page.provisional
                  ? "border-2 border-amber-300"
                  : "border-2 border-slate-200"
              }`}
            >
              <div
                className={`flex items-center justify-between gap-2 border-b border-dashed px-4 py-1.5 ${
                  page.provisional
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-300"
                }`}
              >
                <p
                  className={`text-[0.55rem] font-bold uppercase tracking-[0.2em] ${
                    page.provisional ? "text-amber-800" : "text-slate-400"
                  }`}
                >
                  {page.provisional
                    ? "Provisional · one reading only"
                    : `Ascend · Skill ${i + 1}`}
                </p>
                <p className="font-mono text-[0.56rem] tracking-wide text-slate-400">
                  {page.ref}
                </p>
              </div>

              <div className="flex gap-4 p-4">
                <Stamp page={page} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.98rem] font-bold leading-tight text-brand-ink">
                    {page.skill}
                  </p>
                  <dl className="mt-1.5 grid gap-1">
                    <Field label="Attained" value={longDate(page.attained)} />
                    <Field label="Issued by" value={page.issuedBy} />
                    <Field
                      label="Proficiency"
                      value={`${page.score} of 100 · ${page.level}`}
                    />
                  </dl>
                  {page.evidence.length > 0 && (
                    <>
                      <p className="mt-2 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Evidence
                      </p>
                      <ul className="mt-0.5 grid gap-0.5">
                        {page.evidence.map((e) => (
                          <li
                            key={e}
                            className="flex gap-1.5 text-[0.74rem] leading-snug text-slate-600"
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"
                            />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {page.provisional && (
                    <p className="mt-2 text-[0.75rem] leading-relaxed text-amber-900">
                      Measured once. It stands until a second reading agrees
                      with it, and says so here so nobody mistakes it for a
                      settled level.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------- the blank pages */}
      {passport.blankPages.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-surface/60 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Blank pages
          </p>
          <p className="mt-1 text-[0.83rem] leading-relaxed text-slate-600">
            {passport.blankPages.length} skill
            {passport.blankPages.length === 1 ? "" : "s"} this role needs, not
            stamped yet — {passport.blankPages.join(", ").toLowerCase()}. They
            sit at the back rather than the front, because the book should open
            on what you have done.
          </p>
        </div>
      )}

      {/* ---------------------------------------------- the last page */}
      <div
        className={`mt-3 overflow-hidden rounded-xl bg-[#fdfbf5] p-4 ${
          issued ? "border-4 border-brand-panel" : "border-4 border-dashed border-slate-300"
        }`}
      >
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          What this is not
        </p>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-700">
          Not a qualification, not an endorsement, and not a prediction that
          this person will do well in your role. It says what they were measured
          doing, when, and how well — and nothing beyond that.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
          {issued ? (
            <>
              <span className="inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
                Share this passport
              </span>
              <span className="text-[0.75rem] text-slate-500">
                A link that expires, and can be withdrawn.
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex min-h-10 cursor-not-allowed items-center rounded-xl border border-slate-200 px-4 text-[0.8rem] font-bold text-slate-300">
                Share
              </span>
              <span className="text-[0.75rem] text-slate-500">
                Off until it is issued. An unissued passport in an
                employer&apos;s hands is worse than none.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
