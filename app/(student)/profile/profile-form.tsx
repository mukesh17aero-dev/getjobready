"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  importCareerDocument,
  saveCareerProfile,
  type CareerProfile,
  type ImportResult,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track as trackEvent } from "@/lib/footprints";
import { BackLink } from "@/components/back-link";
import {
  NOTICE_PERIODS,
  TRACKS,
  WORK_PREFERENCES,
  YEARS_OF_STUDY,
  completeness,
  missingEssentials,
  toFields,
  type ProfileFields,
  type Track,
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
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-[0.72rem] text-slate-400">{hint}</span>}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
      />
    </label>
  );
}

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

  const initial = toFields(profile);
  const [fields, setFields] = useState<ProfileFields>({
    ...initial,
    fullName: initial.fullName || suggestedName,
  });
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
      // A CV with a job title is almost certainly someone already working.
      if (!next.track) next.track = take("currentRole") ? "early_career" : "student";
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
  const percent = completeness(fields);

  async function save() {
    setBusy(true);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.push("/login?next=/profile");
      return;
    }
    const result = await saveCareerProfile(token, {
      // Education and experience detail arrive with Resume Studio, which reads
      // them from a real CV; this form owns the preferences that steer
      // recommendations.
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: { ...fields },
    });
    setBusy(false);
    setSaved(Boolean(result));
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

      {missing.length > 0 && (
        <p className="mt-3 rounded-xl bg-violet-50 px-4 py-2.5 text-[0.82rem] text-violet-900">
          <strong className="font-semibold">Still needed for recommendations:</strong>{" "}
          {missing.join(", ")}.
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
          <div className="mt-3 rounded-lg bg-teal-50 px-3.5 py-2.5 text-[0.82rem] text-teal-900">
            <p className="font-semibold">
              Read {imported.suggestions.length} details
              {imported.skills.length > 0 && `, ${imported.skills.length} skills`}
              {imported.activities.length > 0 &&
                `, ${imported.activities.length} activities`}{" "}
              from your {imported.source === "linkedin" ? "LinkedIn export" : "CV"}.
            </p>
            <ul className="mt-1.5 grid gap-0.5 text-[0.76rem] text-teal-800">
              {imported.suggestions.map((suggestion) => (
                <li key={suggestion.field}>
                  <strong className="font-semibold">{suggestion.field}:</strong>{" "}
                  {suggestion.value}
                </li>
              ))}
            </ul>
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
          <section className="mt-7 grid gap-5">
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              About you
            </h2>
            <Text
              label="Your name"
              hint="Used on your resume and Passport."
              value={fields.fullName}
              onChange={set("fullName")}
              placeholder="Priya Sharma"
            />
            <Text
              label="Where you are"
              hint="City and state."
              value={fields.city}
              onChange={set("city")}
              placeholder="Coimbatore, Tamil Nadu"
            />
            <Text
              label="Languages you work in"
              hint="Comma separated."
              value={fields.languages}
              onChange={set("languages")}
              placeholder="English, Tamil, Hindi"
            />
            <Text
              label="Your skills"
              hint="Comma separated — including from college or part-time work."
              value={fields.skills}
              onChange={set("skills")}
              placeholder="Customer service, MS Excel, Tally, Tamil"
            />
            <label className="block">
              <span className="text-[0.8rem] font-semibold text-slate-800">
                Extra-curricular activities
              </span>
              <span className="block text-[0.72rem] text-slate-400">
                One per line — clubs, NSS/NCC, sports, volunteering, certificates.
              </span>
              <textarea
                rows={3}
                value={fields.activities}
                onChange={(e) => set("activities")(e.target.value)}
                placeholder={"Volunteer coordinator, NSS unit\nCaptain of the college basketball team"}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </label>
            <Choice
              label="Work preference"
              value={fields.workPreference}
              options={WORK_PREFERENCES}
              onChange={set("workPreference")}
            />
          </section>

          {fields.track === "student" ? (
            <section className="mt-7 grid gap-5">
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                Your studies
              </h2>
              <Text
                label="College or institution"
                value={fields.institution}
                onChange={set("institution")}
                placeholder="PSG College of Arts and Science"
              />
              <Text
                label="What you're studying"
                hint="Course and stream."
                value={fields.course}
                onChange={set("course")}
                placeholder="B.Com, Commerce"
              />
              <Choice
                label="Year of study"
                value={fields.yearOfStudy}
                options={YEARS_OF_STUDY}
                onChange={set("yearOfStudy")}
              />
              <Text
                label="When you finish"
                hint="Employers plan intake around this."
                value={fields.expectedFinish}
                onChange={set("expectedFinish")}
                placeholder="May 2027"
              />
              <Text
                label="Internships or part-time work"
                hint="Total months. Put 0 if none."
                value={fields.internshipMonths}
                onChange={set("internshipMonths")}
                placeholder="3"
              />
            </section>
          ) : (
            <section className="mt-7 grid gap-5">
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                Your work so far
              </h2>
              <Text
                label="Current or most recent role"
                hint="Your actual title."
                value={fields.currentRole}
                onChange={set("currentRole")}
                placeholder="Customer Support Executive"
              />
              <Text
                label="Employer"
                hint="Optional."
                value={fields.employer}
                onChange={set("employer")}
                placeholder="Zeta Support Services"
              />
              <Text
                label="How long you have worked"
                hint="Total months across all jobs, including internships."
                value={fields.experienceMonths}
                onChange={set("experienceMonths")}
                placeholder="18"
              />
              <Choice
                label="When you could start"
                hint="Decides which openings are realistic today."
                value={fields.noticePeriod}
                options={NOTICE_PERIODS}
                onChange={set("noticePeriod")}
              />
              <Text
                label="What you are looking for"
                hint="One line — pay, growth, hours, the work itself."
                value={fields.reasonForChange}
                onChange={set("reasonForChange")}
                placeholder="Want a role with clearer growth than shift work"
              />
            </section>
          )}
        </>
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="flex-1 text-xs text-slate-500">
          {saved ? "Saved to your career record." : "You can change any of this later."}
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
