import type { ProfileDraft } from "@/lib/api";
import { CopyButton } from "@/components/ui/copy-button";
import { Avatar } from "@/components/ui/avatar";

// The profile as LinkedIn would show it.
//
// Drawn in Ascend's own components rather than mimicking LinkedIn's brand: no
// logo, no blue, no lifted styling. It is a preview of the person's words in
// roughly the shape they will sit in, which is what makes a headline of the
// wrong length or an empty About obvious - and that is the whole job of this
// panel.
//
// Every section that will be pasted into LinkedIn carries its own copy
// control. Section by section rather than one button for the lot: LinkedIn is
// edited field by field, and a single "copy everything" leaves somebody
// cutting a blob apart in a textarea.
//
// Empty sections are rendered as empty rather than skipped. A preview that
// quietly omits the About somebody does not have is a preview that lets them
// keep not having one.

function Empty({ what }: { what: string }) {
  return (
    <p className="rounded-lg bg-slate-100 px-3 py-2.5 text-[0.82rem] italic leading-relaxed text-slate-500">
      No {what} yet. This is the gap a recruiter sees too.
    </p>
  );
}

export function LinkedInPreview({
  draft,
  name = "Your name",
  location = "Bengaluru, Karnataka",
  openToBadge = true,
}: {
  draft: ProfileDraft;
  name?: string;
  location?: string;
  openToBadge?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      {/* ---- the card everybody sees first ---- */}
      <div className="h-16 bg-gradient-to-r from-teal-700 to-emerald-700 sm:h-20" />
      <div className="px-4 pb-4 sm:px-5">
        <div className="flex items-end justify-between gap-3">
          <Avatar
            src={draft.photo}
            name={initials || "AK"}
            className="-mt-9 h-16 w-16 shrink-0 rounded-full border-4 border-white sm:h-20 sm:w-20"
            fallbackClassName="grid place-items-center bg-brand-mist text-[1.2rem] font-bold text-brand-teal-deep sm:text-[1.4rem]"
          />
          {openToBadge && draft.openTo && (
            <span className="mb-1 rounded-md bg-teal-50 px-2.5 py-1 text-[0.68rem] font-bold text-teal-800 ring-1 ring-inset ring-teal-600/25">
              Open to work
            </span>
          )}
        </div>

        <h2 className="mt-2 text-[1.15rem] font-bold leading-tight text-brand-ink">
          {name}
        </h2>
        {draft.headline ? (
          <div className="mt-0.5 flex items-start gap-2">
            <p className="min-w-0 flex-1 text-[0.88rem] leading-snug text-slate-700">
              {draft.headline}
            </p>
            <CopyButton value={draft.headline} label="headline" />
          </div>
        ) : (
          <div className="mt-1">
            <Empty what="headline" />
          </div>
        )}
        <p className="mt-1 text-[0.76rem] text-slate-400">{location}</p>

        {draft.openTo && (
          <div className="mt-3 rounded-lg border border-teal-600/25 bg-teal-50/60 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-wide text-teal-800">
                Open to work
              </p>
              <CopyButton value={draft.openTo} label="open to work line" />
            </div>
            <p className="mt-0.5 text-[0.82rem] leading-snug text-slate-700">
              {draft.openTo}
            </p>
          </div>
        )}
      </div>

      {/* ---- About ---- */}
      <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[0.95rem] font-bold text-brand-ink">About</h3>
          {draft.about && (
            <CopyButton value={draft.about} label="About section" />
          )}
        </div>
        <div className="mt-1.5">
          {draft.about ? (
            <p className="whitespace-pre-line text-[0.85rem] leading-relaxed text-slate-700">
              {draft.about}
            </p>
          ) : (
            <Empty what="About section" />
          )}
        </div>
      </div>

      {/* ---- Experience ---- */}
      <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[0.95rem] font-bold text-brand-ink">
            Experience &amp; projects
          </h3>
          {draft.experience && draft.experience.length > 0 && (
            <CopyButton
              value={draft.experience
                .map((e) =>
                  [
                    e.organisation ? `${e.title} — ${e.organisation}` : e.title,
                    ...e.bullets.map((b) => `• ${b}`),
                  ].join("\n"),
                )
                .join("\n\n")}
              label="all experience"
            />
          )}
        </div>
        <div className="mt-1.5">
          {draft.experience && draft.experience.length > 0 ? (
            <ol className="grid gap-3">
              {draft.experience.map((entry) => (
                <li key={`${entry.title}-${entry.organisation}`}>
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 text-[0.88rem] font-bold leading-snug text-brand-ink">
                      {entry.title}
                    </p>
                    {/* Just the bullets: LinkedIn asks for the title and the
                        company in their own fields, so pasting them into the
                        description is how they end up written twice. */}
                    <CopyButton
                      value={entry.bullets.map((b) => `• ${b}`).join("\n")}
                      label={`bullets for ${entry.title}`}
                    />
                  </div>
                  {entry.organisation && (
                    <p className="text-[0.78rem] text-slate-500">
                      {entry.organisation}
                    </p>
                  )}
                  <ul className="mt-1 grid gap-1">
                    {entry.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex gap-2 text-[0.83rem] leading-relaxed text-slate-700"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <Empty what="projects or roles" />
          )}
        </div>
      </div>

      {/* ---- Skills ---- */}
      <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[0.95rem] font-bold text-brand-ink">Skills</h3>
          {draft.skills && draft.skills.length > 0 && (
            // One per line: LinkedIn takes skills one at a time, and a
            // comma-separated string has to be pulled apart by hand.
            <CopyButton value={draft.skills.join("\n")} label="all skills" />
          )}
        </div>
        <div className="mt-1.5">
          {draft.skills && draft.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {draft.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-brand-mist px-3 py-1 text-[0.8rem] font-semibold text-brand-ink"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <Empty what="skills" />
          )}
        </div>
      </div>
    </div>
  );
}
