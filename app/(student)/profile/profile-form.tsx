"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  importCareerDocument,
  saveCareerProfile,
  type CareerProfile,
  type ImportResult,
  reflectCareerProfile,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track as trackEvent } from "@/lib/footprints";
import { BackLink } from "@/components/back-link";
import {
  NOTICE_PERIODS,
  TRACKS,
  WORK_PREFERENCES,
  FIELD_LABELS,
  completeness,
  educationForRecord,
  emptyEducation,
  experienceForRecord,
  marksFromEducation,
  emptyExperience,
  hasSubstance,
  missingEssentials,
  missingForCompletion,
  WORK_KINDS,
  readEducation,
  readExperience,
  workKindLabel,
  reflectionAnswers,
  type EducationEntry,
  type ExperienceEntry,
  toFields,
  type ProfileFields,
  type Track,
  BUSINESS_SPACES,
} from "@/lib/profile";

// One short form written to the Career Master Record, branching on who the
// person is. Every field says why it is asked, because a student who does not
// see the point stops filling it in.

function Text({
  label,
  hint,
  value,
  onChange,
  placeholder,
  inputMode,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric";
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-[0.72rem] text-slate-400">{hint}</span>}
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-[0.9rem] outline-none focus:ring-2 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-300 focus:border-brand-violet focus:ring-brand-violet/20"
        }`}
      />
      {error && (
        <span role="alert" className="mt-1 block text-[0.72rem] text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

// Percentages must land between 1 and 100; anything typed into a number box
// is reduced to digits, so letters simply do nothing.
const percentValid = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 100;
};
const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 3);
// A written answer has to look like language: at least three characters,
// starts with a letter, reasonable characters only, and no five-letter-plus
// "word" without a vowel (which is how keyboard mash reads).
function looksWritten(value: string): boolean {
  const v = value.trim();
  if (v.length < 3) return false;
  if (!/^[a-z][a-z0-9 .,&()'\-\/+]*$/i.test(v)) return false;
  return !v
    .split(/\s+/)
    .some((word) => word.length >= 5 && !/[aeiou]/i.test(word));
}

// Chips that toggle in and out of a comma-separated value.
function Part({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5">
      <h2 className="text-[1rem] font-semibold tracking-tight text-brand-ink">
        {title}
      </h2>
      <p className="mt-0.5 text-[0.78rem] leading-relaxed text-slate-500">
        {blurb}
      </p>
      <div className="mt-4 grid gap-5">{children}</div>
    </section>
  );
}

function HistoryList<T extends Record<string, string>>({
  title,
  hint,
  addLabel,
  entries,
  blank,
  fields,
  caption,
  onChange,
}: {
  title: string;
  hint: string;
  addLabel: string;
  entries: T[];
  blank: () => T;
  /** Which boxes one entry has, in the order they are asked. */
  fields: Array<{
    key: keyof T & string;
    label: string;
    placeholder?: string;
    wide?: boolean;
    inputMode?: "numeric";
    /** A tick rather than a box: "still here", where a year cannot say it. */
    tick?: string;
    /** A short list to choose from - what kind of work this was. */
    options?: ReadonlyArray<{ id: string; label: string }>;
    /** Hidden while another field is ticked - a leaving year for a job you
        have not left is a question with no answer. */
    hideWhen?: (entry: T) => boolean;
    /** Returns a message when this value is not usable, nothing when it is. */
    check?: (value: string) => string | undefined;
  }>;
  /** The line at the top of each card, so a list of five is readable. */
  caption: (entry: T) => string;
  onChange: (next: T[]) => void;
}) {
  const update = (index: number, key: string, value: string) =>
    onChange(entries.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  return (
    <section className="border-t border-slate-200 pt-4">
      <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </h2>
      <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-500">{hint}</p>

      <div className="mt-3 grid gap-3">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-brand-mist/60 p-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[0.75rem] font-bold text-slate-500">
                {caption(entry)}
              </p>
              <button
                type="button"
                onClick={() => onChange(entries.filter((_, i) => i !== index))}
                className="min-h-11 text-[0.75rem] font-semibold text-slate-400 transition-colors hover:text-rose-600"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                if (field.hideWhen?.(entry)) return null;
                if (field.tick) {
                  return (
                    <label
                      key={field.key}
                      className="flex min-h-11 cursor-pointer items-center gap-2.5 sm:col-span-2"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(entry[field.key])}
                        onChange={(e) =>
                          update(index, field.key, e.target.checked ? "yes" : "")
                        }
                        className="h-5 w-5 shrink-0 accent-teal-700"
                      />
                      <span className="text-[0.82rem] text-slate-700">{field.tick}</span>
                    </label>
                  );
                }
                if (field.options) {
                  return (
                    <label key={field.key} className="block">
                      <span className="text-[0.8rem] font-semibold text-slate-800">
                        {field.label}
                      </span>
                      <select
                        value={entry[field.key] ?? ""}
                        onChange={(e) => update(index, field.key, e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.9rem] text-brand-ink outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                      >
                        {field.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                return (
                <div
                  key={field.key}
                  className={field.wide ? "sm:col-span-2" : undefined}
                >
                  <Text
                    label={field.label}
                    value={entry[field.key] ?? ""}
                    onChange={(v) =>
                      update(
                        index,
                        field.key,
                        field.inputMode === "numeric" ? digitsOnly(v) : v,
                      )
                    }
                    placeholder={field.placeholder}
                    inputMode={field.inputMode}
                    error={field.check?.(entry[field.key] ?? "")}
                  />
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...entries, blank()])}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-4 text-[0.82rem] font-semibold text-slate-600 transition-colors hover:border-brand-teal hover:text-brand-ink"
      >
        <span aria-hidden className="text-[1rem] leading-none">+</span>
        {addLabel}
      </button>
    </section>
  );
}

function MultiChoice({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const chosen = value.split(",").map((s) => s.trim()).filter(Boolean);
  const toggle = (option: string) => {
    const next = chosen.includes(option)
      ? chosen.filter((c) => c !== option)
      : [...chosen, option];
    onChange(next.join(", "));
  };
  return (
    <div>
      <span className="text-[0.8rem] font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-[0.72rem] text-slate-400">{hint}</span>}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={chosen.includes(option)}
            onClick={() => toggle(option)}
            className={`rounded-full border px-3 py-1.5 text-[0.8rem] transition-colors ${
              chosen.includes(option)
                ? "border-brand-violet bg-brand-violet text-white"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-[0.72rem] text-slate-400">{hint}</span>}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={3}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 min-h-11 w-full resize-y rounded-lg border bg-surface px-3 py-2 text-[0.9rem] outline-none focus:ring-2 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-300 focus:border-brand-violet focus:ring-brand-violet/20"
        }`}
      />
      {error && (
        <span role="alert" className="mt-1 block text-[0.72rem] text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

// "May 2027", "Sept 2026", "January 2028" - a real month name (full or
// standard abbreviation, nothing glued onto it) and a 4-digit year.
const FINISH_SHAPE =
  /^\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+((?:19|20)\d{2})\s*$/i;

function Choice({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-[0.8rem] font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-[0.72rem] text-slate-400">{hint}</span>}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(value === option ? "" : option)}
            className={`rounded-full border px-3 py-1.5 text-[0.8rem] transition-colors ${
              value === option
                ? "border-brand-violet bg-brand-violet text-white"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProfileForm({
  profile,
  suggestedName,
}: {
  profile: CareerProfile | null;
  suggestedName: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const isWelcome = params.get("welcome") === "1";

  const professionalPart = () => (
    <Part
      key="professional"
      title="Professional"
      blurb="What you can do, and where you have done it. Empty is fine - it says something true rather than leaving a gap."
    >
      <Text
        label="Your skills"
        hint="Comma separated - including from college or part-time work."
        value={fields.skills}
        onChange={set("skills")}
        placeholder="Customer service, MS Excel, Tally, Tamil"
      />
      <HistoryList
        title="Where you have worked"
        hint="Any job, internship, family business or freelance work - one entry each."
        addLabel="Add work history"
        entries={experience}
        blank={emptyExperience}
        onChange={setExperience}
        caption={(entry) =>
          entry.title.trim()
            ? `${workKindLabel(entry.kind)} - ${entry.title.trim()}`
            : workKindLabel(entry.kind)
        }
        fields={[
          { key: "kind", label: "What kind of work", options: WORK_KINDS },
          { key: "title", label: "What you did there", placeholder: "Store assistant" },
          {
            key: "organisation",
            label: "Company or organisation",
            placeholder: "Sharma General Stores",
          },
          { key: "from", label: "Started", placeholder: "2023", inputMode: "numeric" as const },
          {
            key: "to",
            label: "Finished",
            placeholder: "2024",
            inputMode: "numeric" as const,
            hideWhen: (entry) => Boolean(entry.current),
          },
          { key: "current", label: "", tick: "I am still working here" },
          {
            key: "detail",
            label: "What the work involved",
            placeholder: "Billing at the counter, stock lists, handling customer questions",
            wide: true,
          },
        ]}
      />
      {experience.some(hasSubstance) && (
        <>
          <Choice
            label="When you could start"
            hint="Decides which openings are realistic today."
            value={fields.noticePeriod}
            options={NOTICE_PERIODS}
            onChange={set("noticePeriod")}
          />
          <Text
            label="What you are looking for (optional)"
            hint="One line - pay, growth, hours, the work itself."
            value={fields.reasonForChange}
            onChange={setChecked("reasonForChange")}
            error={errors.reasonForChange}
            placeholder="Want a role with clearer growth than shift work"
          />
        </>
      )}
    </Part>
  );

  const educationalPart = () => (
    <Part
      key="educational"
      title="Education"
      blurb="Every stage you have finished or are in now, and how you learn."
    >
      <HistoryList
        title="Where you studied"
        hint="Add each one - your tenth, your twelfth, your degree."
        addLabel="Add education"
        entries={education}
        blank={emptyEducation}
        onChange={setEducation}
        caption={(entry) => entry.qualification.trim() || "New entry"}
        fields={[
          { key: "qualification", label: "Qualification", placeholder: "Class XII" },
          { key: "institution", label: "School or college", placeholder: "Kendriya Vidyalaya, Coimbatore" },
          { key: "from", label: "Started", placeholder: "2019", inputMode: "numeric" as const },
          {
            key: "to",
            label: "Finished",
            placeholder: "2021",
            inputMode: "numeric" as const,
            hideWhen: (entry) => Boolean(entry.current),
          },
          { key: "current", label: "", tick: "I am still studying here" },
          { key: "stream", label: "Stream (optional)", placeholder: "Commerce" },
          {
            key: "marks",
            label: "Marks % (optional)",
            placeholder: "78",
            inputMode: "numeric" as const,
            check: (value: string) =>
              !value.trim() || percentValid(value)
                ? undefined
                : "A percentage between 1 and 100.",
          },
        ]}
      />
      {/* Only for someone still studying. Anyone who has finished has already
          said when, on the card for that qualification - asking again would
          be asking a question their own answer has closed. */}
      {education.some((entry) => Boolean(entry.current)) && (
        <Text
          label="When you expect to finish"
          hint="The month you expect to be done. Employers plan intake around this."
          value={fields.expectedFinish}
          onChange={(v) => {
            setFinishError(null);
            set("expectedFinish")(v);
          }}
          error={finishError ?? undefined}
          placeholder="May 2027"
        />
      )}
      <Text
        label="Favourite subjects in school"
        value={fields.favSubjectsSchool}
        onChange={setChecked("favSubjectsSchool")}
        error={errors.favSubjectsSchool}
        placeholder="Maths, Geography"
      />
      <Text
        label="Favourite subjects in college"
        value={fields.favSubjectsCollege}
        onChange={setChecked("favSubjectsCollege")}
        error={errors.favSubjectsCollege}
        placeholder="Statistics, Marketing"
      />
    </Part>
  );

  const initial = toFields(profile);
  const [fields, setFields] = useState<ProfileFields>({
    ...initial,
    fullName: initial.fullName || suggestedName,
  });
  // Schooling and jobs are lists: a tenth, a twelfth and a degree; one job or
  // three. They live in the record's own arrays, which the resume reads.
  const [education, setEducation] = useState<EducationEntry[]>(
    readEducation(profile?.education),
  );
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    readExperience(profile?.experience),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const set = (key: keyof ProfileFields) => (value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  function chooseTrack(id: Track) {
    setFields((f) => ({ ...f, track: id }));
    setSaved(false);
    trackEvent({
      family: "decision",
      event: "profile_track_chosen",
      module: "career_record",
      target: id,
    });
  }

  // Reading a CV or LinkedIn export fills the form in — it never saves. The
  // student sees what we read and can change any of it before saving.
  async function importFrom(file: File, source: "resume" | "linkedin") {
    setImporting(true);
    setImportError(null);
    setImported(null);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.push("/login?next=/profile");
      return;
    }
    const result = await importCareerDocument(token, file, source);
    setImporting(false);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    const found = result.data;
    setImported(found);

    // Every job and every qualification the document lists, as cards they can
    // check and correct. Only added when the list is still empty - an import
    // must never quietly overwrite what someone has already typed.
    const importedWork = (found.experience ?? []).map((row) => ({
      kind: row.kind || "job",
      title: row.title,
      organisation: row.organisation,
      from: row.from,
      to: row.to,
      current: row.current ? "yes" : "",
      detail: row.detail,
    }));
    const importedStudy = (found.education ?? []).map((row) => ({
      qualification: row.qualification,
      institution: row.institution,
      from: row.from,
      to: row.to,
      current: row.current ? "yes" : "",
      marks: row.marks,
      stream: row.stream,
    }));
    if (importedWork.length && !experience.some(hasSubstance)) setExperience(importedWork);
    if (importedStudy.length && !education.some(hasSubstance)) setEducation(importedStudy);

    setFields((f) => {
      const next = { ...f };
      const take = (field: string) =>
        found.suggestions.find((s) => s.field === field)?.value ?? "";
      // Only fill what is still empty — never overwrite something typed.
      const fill = (key: Exclude<keyof ProfileFields, "track">, value: string) => {
        if (value && !String(next[key] ?? "").trim()) next[key] = value;
      };
      fill("fullName", take("fullName"));
      fill("city", take("city"));
      fill("currentRole", take("currentRole"));
      fill("institution", take("institution"));
      fill("course", take("course"));
      if (found.languages?.length) fill("languages", found.languages.join(", "));
      if (found.skills.length) fill("skills", found.skills.join(", "));
      if (found.activities.length) fill("activities", found.activities.join("\n"));
      // The document decides, so nobody has to answer a question it already
      // answers: still at college with no finished job reads as studying;
      // anything else reads as someone already in work.
      if (!next.track) {
        const stillStudying = importedStudy.some((row) => row.current === "yes");
        const hasWorked =
          importedWork.length > 0 || Boolean(take("currentRole"));
        next.track = hasWorked && !stillStudying ? "early_career" : "student";
      }
      return next;
    });
    setSaved(false);
    trackEvent({
      family: "engagement",
      event: "profile_imported",
      module: "career_record",
      target: source,
      meta: { fields: found.suggestions.length, skills: found.skills.length },
    });
  }

  const missing = missingEssentials(fields);
  const gaps = missingForCompletion(fields);
  const percent = completeness(fields);

  const [finishError, setFinishError] = useState<string | null>(null);
  // Said next to the button that did nothing, because an error attached to a
  // box far up the page - or to one that is not on screen at all - is an
  // error nobody sees.
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFields, string>>>({});
  // The story survives visits: it is stored with the profile's preferences
  // and greets the person whenever they come back.
  const storedStory = profile?.preferences?.["storySummary"];
  const [summary, setSummary] = useState<string | null>(
    typeof storedStory === "string" && storedStory.trim() ? storedStory : null,
  );
  // What the model last saw (starting from what was already stored) - the
  // reflection is only requested when a save actually changes something.
  const lastReflected = useRef(JSON.stringify(reflectionAnswers(initial)));
  const storyRef = useRef<HTMLDivElement>(null);
  const [reflecting, setReflecting] = useState(false);

  // The open text boxes, and what a bad answer should hear.
  // Only what this form actually asks. Institution, course, current role,
  // employer and internship experience were retired into the two history
  // lists, but their old values still sit in the record - and checking a
  // value nobody can see means a save that refuses with no box to fix.
  const WRITTEN: Array<{ key: keyof ProfileFields; message: string }> = [
    { key: "fullName", message: "That doesn't read like a name - check it?" },
    { key: "city", message: "That doesn't read like a place - check it?" },
    { key: "aspirations", message: "A few honest lines help here - this doesn't read like them yet." },
    { key: "favSubjectsSchool", message: "That doesn't read like subjects - check it?" },
    { key: "favSubjectsCollege", message: "That doesn't read like subjects - check it?" },
    // Asked only of someone who has added work, so checked only then.
    ...(experience.some(hasSubstance)
      ? [
          {
            key: "reasonForChange" as const,
            message: "A few real words help here - check it?",
          },
        ]
      : []),
  ];

  const setChecked = (key: keyof ProfileFields) => (value: string) => {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    setSummary(null);
    set(key)(value);
  };

  async function save() {
    // Every open text box must read like language before anything saves.
    const found: Partial<Record<keyof ProfileFields, string>> = {};
    for (const { key, message } of WRITTEN) {
      const value = String(fields[key] ?? "").trim();
      if (value && !looksWritten(value)) found[key] = message;
    }
    // Marks are checked on the education card they were typed into, not
    // here: these three values are worked out from those cards, so a stale
    // one from an older visit must not block a save nobody can unblock.
    // The one free-text field with a shape: a month and a year. Empty is
    // allowed (not everyone knows yet); nonsense is not. Only checked when
    // the box is on screen - a stale value behind a hidden field must never
    // block a save.
    const stillStudying = education.some((entry) => Boolean(entry.current));
    let finishProblem: string | null = null;
    if (stillStudying && fields.expectedFinish.trim() !== "") {
      const match = FINISH_SHAPE.exec(fields.expectedFinish);
      const year = match ? Number(match[2]) : 0;
      const now = new Date().getFullYear();
      if (!match) {
        finishProblem = "Give a month and a year - like May 2027.";
      } else if (year < now - 1 || year > now + 8) {
        finishProblem = `That year looks off - expected between ${now - 1} and ${now + 8}.`;
      }
    }
    setFinishError(finishProblem);
    setErrors(found);

    if (Object.keys(found).length > 0 || finishProblem) {
      const named = [
        ...Object.keys(found).map(
          (key) => FIELD_LABELS[key as keyof ProfileFields] ?? key,
        ),
        ...(finishProblem ? ["when you expect to finish"] : []),
      ];
      setFormError(
        named.length === 1
          ? `Not saved yet - have another look at ${named[0]}.`
          : `Not saved yet - ${named.length} answers need a look: ${named.join(", ")}.`,
      );
      // Take them to the first one rather than leaving them hunting.
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFormError(null);
    setBusy(true);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy(false);
      router.push("/login?next=/profile");
      return;
    }
    const result = await saveCareerProfile(token, {
      // The two histories this form now owns. An empty row is not a fact, so
      // it is dropped rather than saved.
      education: education.filter(hasSubstance).map(educationForRecord),
      experience: experience.filter(hasSubstance).map(experienceForRecord),
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: {
        ...fields,
        // Marks are typed once, against the qualification they belong to.
        ...marksFromEducation(education),
        ...(summary ? { storySummary: summary } : {}),
      },
    });
    setBusy(false);
    setSaved(Boolean(result));
    // A failed save has to say so: "Saved" quietly not appearing is how
    // people lose an afternoon's typing.
    setFormError(
      result ? null : "That didn't save. Check your connection and try again.",
    );
    const snapshot = JSON.stringify(reflectionAnswers(fields));
    if (result && !isWelcome && snapshot !== lastReflected.current) {
      lastReflected.current = snapshot;
      setReflecting(true);
      setTimeout(() => {
        storyRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }, 60);
      // Advisory, after the fact: the model double-checks the answers and
      // reflects the story back. Slow or absent, the save stands either way.
      void Promise.race([
        reflectCareerProfile(token, reflectionAnswers(fields)),
        new Promise<null>((r) => setTimeout(() => r(null), 8000)),
      ]).then((reflection) => {
        setReflecting(false);
        if (!reflection) return;
        if (reflection.issues.length > 0) {
          setErrors((e) => {
            const next = { ...e };
            for (const issue of reflection.issues) {
              next[issue.field as keyof ProfileFields] = issue.message;
            }
            return next;
          });
        }
        if (reflection.summary) {
          setSummary(reflection.summary);
          // Persist the story with the profile so the next visit shows it.
          void saveCareerProfile(token, {
            education: profile?.education ?? [],
            experience: profile?.experience ?? [],
            projects: profile?.projects ?? [],
            achievements: profile?.achievements ?? [],
            preferences: { ...fields, storySummary: reflection.summary },
          });
        }
      });
    }
    trackEvent({
      family: "decision",
      event: "profile_saved",
      module: "career_record",
      target: fields.track || "unset",
      meta: { completeness: percent },
    });
    if (result && isWelcome) router.push("/start");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
      <div className="pt-4">
        <BackLink fallbackHref="/" fallbackLabel="Back to home" />
      </div>

      <header className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isWelcome ? "Tell us enough to guide you" : "Your profile"}
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-slate-600">
          This shapes what we recommend. You can change it any time.
        </p>
      </header>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-teal transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[0.78rem] tabular-nums text-slate-500">
          {percent}% complete
        </span>
      </div>

      {(summary || reflecting) && (
        <div ref={storyRef} className="mt-4 scroll-mt-20 rounded-2xl border border-teal-700/30 bg-teal-50 p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-700">
            Your story so far
          </p>
          {reflecting && !summary && (
            <p className="mt-1.5 animate-pulse text-[0.92rem] leading-relaxed text-slate-600">
              Understanding you better&hellip;
            </p>
          )}
          {summary && (
          <>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate-800">
            {(() => {
              // The greeting is added here, not by the model - the name
              // never leaves the browser for the reflection call.
              const first = fields.fullName.trim().split(/\s+/)[0];
              return first ? `Hi ${first} - ${summary}` : summary;
            })()}
          </p>
          {gaps.length > 0 ? (
            <>
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.8rem] leading-snug text-amber-900">
                <strong className="font-semibold">
                  {percent}% complete - still to fill:
                </strong>{" "}
                {gaps.join(", ")}. Complete these and the exploring begins.
              </p>
              <span className="mt-3 inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-slate-300 px-4 py-2 text-[0.85rem] font-bold text-slate-500">
                Explore your next step &rarr;
              </span>
            </>
          ) : (
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-teal-deep px-4 py-2 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
            >
              Explore your next step &rarr;
            </Link>
          )}
          </>
          )}
        </div>
      )}

      {missing.length > 0 && !summary && !reflecting && (
        <p className="mt-3 rounded-xl bg-violet-50 px-4 py-2.5 text-[0.82rem] text-violet-900">
          <strong className="font-semibold">
            The more you share, the better a companion we can be.
          </strong>{" "}
          A little more about you - {missing.join(", ").toLowerCase()} - helps
          us walk the road with you from wherever you are today, whether
          you&rsquo;re still studying or already working - instead of guessing.
        </p>
      )}

      {/* Fastest path: read an existing CV or LinkedIn export. */}
      <section className="mt-5 rounded-xl border border-slate-200 bg-surface p-4">
        <h2 className="text-[0.9rem] font-semibold text-slate-900">
          Already have a CV or a LinkedIn profile?
        </h2>
        <p className="mt-0.5 text-[0.8rem] text-slate-500">
          Your document is read to fill this form in — nothing is saved until
          you press save.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg bg-brand-violet px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep">
            {importing ? "Reading…" : "Upload your CV"}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFrom(file, "resume");
                e.target.value = "";
              }}
            />
          </label>
          <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
            Upload your LinkedIn PDF
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFrom(file, "linkedin");
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {importError && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3.5 py-2 text-[0.82rem] text-rose-700">
            {importError}
          </p>
        )}
        {imported && (
          <div className="mt-3 rounded-lg bg-teal-50 px-3.5 py-2.5 text-[0.82rem] text-teal-700">
            <p className="font-semibold">
              Read {imported.suggestions.length} details
              {imported.skills.length > 0 && `, ${imported.skills.length} skills`}
              {imported.activities.length > 0 &&
                `, ${imported.activities.length} activities`}{" "}
              from your {imported.source === "linkedin" ? "LinkedIn export" : "CV"}.
            </p>
            <ul className="mt-1.5 grid gap-0.5 text-[0.76rem] text-teal-700">
              {imported.suggestions.map((suggestion) => (
                <li key={suggestion.field}>
                  <strong className="font-semibold">{suggestion.field}:</strong>{" "}
                  {suggestion.value}
                </li>
              ))}
            </ul>
            {(imported.experience?.length || imported.education?.length) && (
              <p className="mt-1.5 text-[0.76rem] text-teal-700">
                Added{" "}
                {[
                  imported.experience?.length
                    ? `${imported.experience.length} work ${imported.experience.length === 1 ? "entry" : "entries"}`
                    : "",
                  imported.education?.length
                    ? `${imported.education.length} education ${imported.education.length === 1 ? "entry" : "entries"}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                below - check each one and correct anything we misread.
              </p>
            )}
            <p className="mt-1.5 text-[0.72rem] text-teal-700">
              We only filled boxes that were empty.
            </p>
          </div>
        )}
      </section>

      {/* 1 — who this person is. Everything below follows from it. */}
      <section className="mt-6">
        <h2 className="text-[0.8rem] font-semibold text-slate-800">
          Which describes you right now?
        </h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {TRACKS.map((option) => {
            const active = fields.track === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => chooseTrack(option.id)}
                className={`rounded-xl border bg-surface p-4 text-left transition-all ${
                  active
                    ? "border-brand-violet ring-3 ring-brand-violet/15"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block text-[0.95rem] font-semibold text-slate-900">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-[0.8rem] leading-snug text-slate-500">
                  {option.blurb}
                </span>
                <span className="mt-2 block text-[0.68rem] font-bold uppercase tracking-wide text-brand-violet-deep">
                  {option.who}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {fields.track && (
        <>
          {/* Four parts, each a heading a person would recognise: who you
              are, what you have done for work, what you have studied, and
              where you want to go. The middle two swap places by track -
              someone working should not scroll past three questions about
              college to reach the boxes that are about them. */}
          <Part title="Personal" blurb="The basics your resume and Passport carry.">
            <Text
              label="Your name"
              hint="Used on your resume and Passport."
              value={fields.fullName}
              onChange={setChecked("fullName")}
              error={errors.fullName}
              placeholder="Priya Sharma"
            />
            <Text
              label="Where you are"
              hint="City and state."
              value={fields.city}
              onChange={setChecked("city")}
              error={errors.city}
              placeholder="Coimbatore, Tamil Nadu"
            />
            <Text
              label="Languages you work in"
              hint="Comma separated."
              value={fields.languages}
              onChange={set("languages")}
              placeholder="English, Tamil, Hindi"
            />
            <label className="block">
              <span className="text-[0.8rem] font-semibold text-slate-800">
                Anything else you do (optional)
              </span>
              <span className="block text-[0.72rem] text-slate-400">
                One per line - volunteering, a club, a sport, a certificate, a
                side project. Employers read these as evidence too.
              </span>
              <textarea
                rows={3}
                value={fields.activities}
                onChange={(e) => set("activities")(e.target.value)}
                placeholder={"Volunteer coordinator, NSS unit\nWeekend tutoring for two neighbours"}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </label>
          </Part>

          {fields.track === "early_career" ? (
            <>
              {professionalPart()}
              {educationalPart()}
            </>
          ) : (
            <>
              {educationalPart()}
              {professionalPart()}
            </>
          )}

          <Part
            title="Aspirations"
            blurb="Where you want this to go. This is what your plan is built around."
          >
            <Choice
              label="Work preference"
              value={fields.workPreference}
              options={WORK_PREFERENCES}
              onChange={set("workPreference")}
            />
            <MultiChoice
              label="Business spaces that interest you"
              hint="Tell us where your interest lies - pick as many as feel like you."
              value={fields.interestedSpaces}
              options={BUSINESS_SPACES}
              onChange={set("interestedSpaces")}
            />
            <TextArea
              label="Your aspirations"
              hint="A few honest lines: where do you want your career to go, and what would success look like to you?"
              value={fields.aspirations}
              onChange={setChecked("aspirations")}
              error={errors.aspirations}
              placeholder="In three years I want to be leading a small support team - steady work, real growth, and enough to help at home."
            />
          </Part>
        </>
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p
          className={`flex-1 text-xs ${
            formError ? "font-semibold text-rose-600" : "text-slate-500"
          }`}
          role={formError ? "alert" : undefined}
        >
          {formError ??
            (saved ? "Saved to your career record." : "You can change any of this later.")}
        </p>
        <button
          type="button"
          disabled={busy || !fields.track}
          onClick={() => void save()}
          className="rounded-lg bg-brand-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-50"
        >
          {busy ? "Saving…" : isWelcome ? "Save and continue" : "Save profile"}
        </button>
      </div>
    </main>
  );
}
