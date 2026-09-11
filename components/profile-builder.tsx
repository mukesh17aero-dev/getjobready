"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptProfileSection,
  importLinkedInPdf,
  reviseProfessionalProfile,
  uploadProfilePhoto,
  writeProfessionalProfile,
  type ProfileDraft,
  type ProfileEntry,
  type ProfileSectionId,
  type ProfileState,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { Picker } from "@/components/picker";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { PhotoPicker } from "@/components/photo-picker";
import { Check } from "@/components/icons";

// The LinkedIn Profile Builder: the profile on the right as LinkedIn
// would show it, and Scribe on the left to change it in plain words.
//
// The same shape as the resume builder, for the same reason. Nobody knows
// what is wrong with a sentence about themselves better than the person it is
// about, and asking them to say it - "the About is too long", "take out the
// bit about the fest" - is faster and truer than any set of fields.
//
// Three things this screen must keep doing:
//
//   Show the refusals. When Scribe will not do something because it would
//   mean inventing a fact, that sits in the thread as its own paragraph. A
//   refusal folded into a cheerful reply is a refusal nobody reads.
//
//   Report what it took on trust. Facts that arrived through an instruction
//   are listed back, because they are what this person will be asked to stand
//   behind in a room we are not in.
//
//   Change nothing without being told. The preview is a draft until each
//   section is kept, one at a time.

const SUGGESTIONS = [
  "The About is too long - cut it to three sentences",
  "Put the store job in the headline",
  "Take out anything I cannot back up",
  "Make it sound less formal",
  "Add that I handled about 60 customers a day",
];

const SECTIONS: Array<{ id: ProfileSectionId; name: string }> = [
  { id: "headline", name: "Headline" },
  { id: "experience", name: "Experience" },
  { id: "about", name: "About" },
  { id: "skills", name: "Skills" },
  { id: "openTo", name: "Open to work" },
];

type Turn = {
  ask: string;
  reply: string;
  changed: string[];
  added: string[];
  declined: string | null;
  followUp: string | null;
};

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

type StartWith = "linkedin" | "resume" | "record";

const START_OPTIONS: ReadonlyArray<{ id: StartWith; label: string }> = [
  { id: "linkedin", label: "Use my LinkedIn profile" },
  { id: "resume", label: "Use a resume I already have" },
  { id: "record", label: "Build it from my Ascend profile" },
];

const START_NOTES: Record<StartWith, string> = {
  linkedin: "Upload the PDF that LinkedIn gives you.",
  resume: "PDF or Word. Your jobs and dates come across with it.",
  record: "Nothing to upload. We use what you have already filled in here.",
};

export function ProfileBuilder({
  initial,
  signedOut = false,
  name,
}: {
  initial: ProfileState;
  signedOut?: boolean;
  name?: string | null;
}) {
  const [state, setState] = useState(initial);
  const [thread, setThread] = useState<Turn[]>([]);
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState<
    ProfileSectionId | "write" | "revise" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const [startWith, setStartWith] = useState<StartWith>("linkedin");
  // Whether they have actually answered "how do you want to start?".
  //
  // The control has always opened on a valid answer, so the card beside it
  // claimed to be a preview of a profile nobody had asked for.
  const [pickedStart, setPickedStart] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const threadRef = useRef<HTMLOListElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  // The thread grows downward and the newest turn is the one being read.
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread.length]);

  const needsAccount = useCallback((what: string, why: string) => {
    setGate({ what, why });
  }, []);

  // Named rather than written inline in the options below: reading a ref
  // during render is what the lint rule is for, and an arrow inside an array
  // literal built at render time counts.
  const chooseFile = useCallback(() => pdfInput.current?.click(), []);

  const write = useCallback(async () => {
    if (signedOut) {
      needsAccount(
        "a profile written from your own record",
        "Writing it means reading everything you have done here - your stories, your answers, your interviews - so there has to be a record, and it has to belong to somebody. What is on the right is an example.",
      );
      return;
    }
    setBusy("write");
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(null);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const result = await writeProfessionalProfile(t);
    setBusy(null);
    if (!result) {
      setError("Could not reach the writer. Try again in a moment.");
      return;
    }
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setState(result);
    setThread([]);
  }, [signedOut, needsAccount]);

  const revise = useCallback(
    async (instruction: string) => {
      const text = instruction.trim();
      if (text.length < 3) return;
      if (signedOut) {
        needsAccount(
          "Scribe, on your own profile",
          "Scribe rewrites what is on the right from your own record. That means there has to be a record, and it has to belong to somebody.",
        );
        return;
      }
      setBusy("revise");
      setError(null);
      const t = await token();
      if (!t) {
        setBusy(null);
        setError("Your session expired. Reload the page and sign in again.");
        return;
      }
      const result = await reviseProfessionalProfile(
        t,
        text,
        thread.map((turn) => ({
          ask: turn.ask,
          reply: turn.reply,
          followUp: turn.followUp,
        })),
      );
      setBusy(null);
      if (!result) {
        setError("Could not reach Scribe. Try again in a moment.");
        return;
      }
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setAsk("");
      setState((s) => ({ ...s, suggested: result.suggested }));
      setThread((list) => [
        ...list,
        {
          ask: text,
          reply: result.revision.reply,
          changed: result.revision.changed,
          added: result.revision.added,
          declined: result.revision.declined,
          followUp: result.revision.followUp,
        },
      ]);
    },
    [signedOut, needsAccount, thread],
  );

  const importPdf = useCallback(
    async (file: File) => {
      if (signedOut) {
        needsAccount(
          "your imported profile",
          "Reading your export and improving it means keeping both - what you had, and what it became - so there has to be somewhere to keep them.",
        );
        return;
      }
      setBusy("write");
      setError(null);
      const t = await token();
      if (!t) {
        setBusy(null);
        setError("Your session expired. Reload the page and sign in again.");
        return;
      }
      const result = await importLinkedInPdf(t, file);
      setBusy(null);
      if (!result) {
        setError("Could not read that file. Try again in a moment.");
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setState(result);
      setThread([]);
    },
    [signedOut, needsAccount],
  );

  const setPhoto = useCallback(
    async (blob: Blob) => {
      if (signedOut) {
        needsAccount(
          "your photo",
          "A photo has to live somewhere, and that somewhere is an account.",
        );
        return;
      }
      setUploading(true);
      setPhotoError(null);
      const t = await token();
      if (!t) {
        setUploading(false);
        setPhotoError(
          "Your session expired. Reload the page and sign in again.",
        );
        return;
      }
      const result = await uploadProfilePhoto(t, blob);
      setUploading(false);
      if (!result) {
        setPhotoError(
          "Could not reach the server. Check you are online and try again.",
        );
        return;
      }
      if ("error" in result) {
        setPhotoError(result.error);
        return;
      }
      setState((s) => ({ ...s, accepted: result.accepted }));
      // The photo is also written onto the auth user, so pulling a fresh
      // session makes it appear in the header and the account menu without a
      // reload. A failure here costs nothing - the next page load has it.
      void supabaseBrowser().auth.refreshSession();
    },
    [signedOut, needsAccount],
  );

  /** Choosing between the three headlines is a local choice until they keep it. */
  const chooseHeadline = useCallback((value: string) => {
    setState((s) => ({ ...s, suggested: { ...s.suggested, headline: value } }));
  }, []);

  const accept = useCallback(
    async (section: ProfileSectionId) => {
      if (signedOut) {
        needsAccount(
          "your professional profile",
          "Keeping a section means it is still there next week, and on the next version. That needs an account for it to live in.",
        );
        return;
      }
      const value = state.suggested[section] as
        string | string[] | ProfileEntry[] | undefined;
      if (value === undefined) return;
      setBusy(section);
      const t = await token();
      if (!t) {
        setBusy(null);
        return;
      }
      const updated = await acceptProfileSection(t, section, value);
      setBusy(null);
      if (updated) setState((s) => ({ ...s, accepted: updated.accepted }));
    },
    [state.suggested, signedOut, needsAccount],
  );

  // Their own name when the record has one; the example's name when this is
  // the example. Never a blank card - a preview with no name on it is not a
  // preview of anybody.
  const displayName =
    name ?? state.name ?? (signedOut ? "Anjali Kumar" : "You");

  const written = Object.keys(state.suggested).length > 0;
  // Imported but not yet improved: they have their own profile on the page
  // and Scribe has not touched it. That is the first step done.
  const imported =
    !written && Object.keys(state.accepted).some((k) => k !== "photo");
  // The right-hand panel shows the working draft, falling back to what they
  // have kept - so it is never blank once there is anything at all.
  const shown: ProfileDraft = {
    ...(written ? state.suggested : state.accepted),
    // The photo is theirs, never drafted, so it always comes from accepted.
    photo: state.accepted.photo,
  };
  // Nothing of theirs is on the page and they have not said how to start, so
  // the card on the right is a stranger's. Blurred and captioned it reads as
  // what it is - the preview, waiting - rather than as their profile.
  //
  // Signed out, only the question counts: the example arrives already filled
  // in, so "have they got something" is true before anybody has done
  // anything. The example is still what the page is for, so it is shown the
  // moment they answer rather than held behind an account.
  const awaitingChoice = signedOut
    ? !pickedStart
    : !pickedStart && !written && !imported;
  const unkept = SECTIONS.filter(
    (s) =>
      state.suggested[s.id] !== undefined &&
      !sameValue(state.suggested[s.id], state.accepted[s.id]),
  );

  return (
    <>
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}

      <input
        ref={pdfInput}
        type="file"
        accept=".pdf,.docx,.txt,.md,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void importPdf(file);
        }}
      />

      <header>
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          Make your profile sound professional
        </h1>
        <p className="mt-2 max-w-3xl text-[0.92rem] leading-relaxed text-slate-600">
          Bring in the profile you already have, then tell Scribe what to change
          in plain words and watch it change on the right. Nothing is kept until
          you say so.
        </p>
        {signedOut && !awaitingChoice && (
          <p className="mt-3 max-w-3xl rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
            <strong className="font-semibold text-brand-ink">
              The profile on the right is an example, not yours.
            </strong>{" "}
            Yours would be written from your own stories, answers and interviews
            which is the point at which this needs an account.
          </p>
        )}
      </header>

      {error && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.85rem] leading-relaxed text-amber-900">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ------------------------------------------------ Scribe, left */}
        <div className="grid content-start gap-3">
          {/* Signed out there is nowhere to put a photo, so asking for one is
              asking for something we cannot keep. Signed in it is a prompt
              only while there is no picture - once there is, changing it lives
              beside the preview rather than at the top of the page. */}
          {!signedOut && !state.accepted.photo && (
            <PhotoPicker
              photo={null}
              name={displayName}
              busy={uploading}
              uploadError={photoError}
              onPick={(blob) => void setPhoto(blob)}
            />
          )}

          {/* One question, three answers, in the order people stand in.
              
              This used to be a card with an emphasised "import" box and a
              smaller "no profile yet?" box under it - two ways in with
              different weights, which reads as a recommendation rather than a
              choice, and left the third way (a resume you already have here)
              hidden inside the first one's paragraph. The resume builder asks
              its one question outright and it is the clearest screen in the
              product, so this asks the same way. */}
          {(signedOut || (!written && !imported)) && (
            <section className="rounded-2xl border border-slate-200 bg-surface p-4">
              <h2 className="text-[0.95rem] font-semibold text-brand-ink">
                How do you want to start?
              </h2>
              <p className="mt-0.5 text-[0.8rem] leading-relaxed text-slate-500">
                Your own words go on the right first. Nothing is changed until
                you ask.
              </p>

              {/* One question, one control, and only the chosen answer shown.
                  Three cards stacked said the same amount in three times the
                  room, and gave the three ways in different visual weights -
                  which reads as a recommendation rather than a choice. */}
              <div className="mt-2.5">
                <Picker
                  label="How do you want to start?"
                  value={startWith}
                  options={START_OPTIONS}
                  onChange={(next) => {
                    setPickedStart(true);
                    setStartWith(next);
                  }}
                  placeholder={pickedStart ? undefined : "Choose one to begin"}
                />
              </div>

              <p className="mt-2.5 text-[0.82rem] leading-relaxed text-slate-600">
                {pickedStart
                  ? START_NOTES[startWith]
                  : "Pick one of the three above and your profile appears on the right."}
              </p>

              <button
                type="button"
                disabled={busy !== null || !pickedStart}
                onClick={() =>
                  startWith === "record" ? void write() : chooseFile()
                }
                className="mt-2.5 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-40"
              >
                {busy === "write"
                  ? "Working on it…"
                  : startWith === "record"
                    ? "Write it for me"
                    : "Upload file"}
              </button>
            </section>
          )}

          {/* Scribe, once there is something to work on - it is the whole
              second half of this feature, and it is also the half that makes
              no sense before the first question is answered: a box asking
              what you want changed, above nothing that could change. */}
          {!awaitingChoice && (
            <section className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5">
              <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
                {imported ? "Step two: change anything" : "Change anything"}
              </h2>

              {state.identity && (
                <p className="mt-2 rounded-xl bg-teal-50/60 px-3 py-2.5 text-[0.84rem] leading-relaxed text-slate-700">
                  <strong className="font-semibold text-brand-ink">
                    In short:
                  </strong>{" "}
                  {state.identity}
                </p>
              )}

              {thread.length === 0 && (
                <>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
                    {written || imported
                      ? "Your profile is on the right. Type what you want changed, in your own words."
                      : "Start with one of the options above. Then type what you want changed."}
                  </p>

                  {/* The clearest possible answer to "what am I supposed to type
                    here": four things somebody could type, that type
                    themselves when pressed. */}
                  {(written || imported) && (
                    <div className="mt-2.5">
                      <p className="text-[0.72rem] font-semibold text-slate-500">
                        For example:
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {SUGGESTIONS.slice(0, 4).map((example) => (
                          <button
                            key={example}
                            type="button"
                            disabled={busy !== null}
                            onClick={() => setAsk(example)}
                            className="cursor-pointer rounded-full border border-slate-300 px-3 py-1 text-[0.74rem] font-semibold text-slate-600 transition-colors hover:border-brand-violet/60 hover:text-brand-ink disabled:opacity-40"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {thread.length > 0 && (
                <ol
                  ref={threadRef}
                  className="mt-3 grid max-h-[20rem] content-start gap-3 overflow-y-auto overscroll-contain pr-1"
                >
                  {thread.map((turn, i) => (
                    <li key={`${turn.ask}-${i}`} className="grid gap-2">
                      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-teal-900">
                        {turn.ask}
                      </p>
                      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-3.5 py-2.5">
                        <p className="text-[0.84rem] leading-relaxed text-slate-700">
                          {turn.reply}
                        </p>
                        {/* A refusal gets its own block. Folded into the reply it
                          reads as agreement and nobody notices it. */}
                        {turn.declined && (
                          <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.8rem] leading-relaxed text-amber-900">
                            {turn.declined}
                          </p>
                        )}
                        {turn.added.length > 0 && (
                          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-500">
                            Added from what you told me: {turn.added.join("; ")}
                            . Make sure you can stand behind it in the
                            interview.
                          </p>
                        )}
                        {turn.followUp && (
                          <p className="mt-1.5 text-[0.83rem] font-semibold leading-relaxed text-brand-ink">
                            {turn.followUp}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {/* The box, with send inside it bottom right - the way every chat
                box a nineteen-year-old has ever used does it. */}
              <div className="relative mt-3">
                <label htmlFor="scribe-profile" className="sr-only">
                  Tell Scribe what to change
                </label>
                <textarea
                  id="scribe-profile"
                  rows={4}
                  value={ask}
                  disabled={busy !== null}
                  onChange={(e) => setAsk(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void revise(ask);
                    }
                  }}
                  placeholder={`e.g. ${SUGGESTIONS[thread.length % SUGGESTIONS.length]}`}
                  className="min-h-[5.5rem] w-full resize-y rounded-xl border border-slate-300 bg-surface py-2.5 pl-3 pr-14 text-[0.85rem] leading-relaxed outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={busy !== null || ask.trim().length < 3}
                  onClick={() => void revise(ask)}
                  aria-label="Send to Scribe"
                  className="absolute bottom-3 right-3 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-brand-violet text-white transition-colors hover:bg-brand-violet-deep disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {busy === "revise" ? (
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[0.72rem] text-slate-400">
                Enter to send, Shift + Enter for a new line.
              </p>

              {/* No import button here. Step one at the top of this column
                already offers it, and the same action twice on one screen
                reads as two different things. */}
              {/* The two ways to start over, kept together. Step one is gone
                from the page once there is a profile, so import lives here -
                one place rather than the two the last version had. */}
              {(written || imported) && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-[0.8rem] text-slate-500">
                    Would rather not pick it apart?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void write()}
                      className="inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.82rem] font-bold text-brand-ink transition-colors hover:border-brand-teal/60 disabled:opacity-40"
                    >
                      {busy === "write"
                        ? "Rewriting…"
                        : "Rewrite the whole thing"}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => pdfInput.current?.click()}
                      className="inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.82rem] font-bold text-brand-ink transition-colors hover:border-brand-teal/60 disabled:opacity-40"
                    >
                      Import a resume or LinkedIn PDF
                    </button>
                  </div>
                </div>
              )}

              {typeof state.sourceCount === "number" && !signedOut && (
                <p className="mt-2.5 text-[0.8rem] text-slate-500">
                  {state.sourceCount === 0
                    ? "Nothing on your record to write from yet."
                    : `From ${state.sourceCount} things on your record, ${state.provenCount} proven.`}
                </p>
              )}
            </section>
          )}
        </div>

        {/* --------------------------------------------- the profile, right */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
              {awaitingChoice ? "Waiting for your choice" : "How it would look"}
            </p>
            {unkept.length > 0 && (
              <p className="text-[0.75rem] font-semibold text-amber-800">
                {unkept.length} section{unkept.length === 1 ? "" : "s"} not kept
                yet
              </p>
            )}
          </div>

          <div className="relative mt-1.5">
            <LinkedInPreview draft={shown} name={displayName} />
            {awaitingChoice && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 px-6 text-center backdrop-blur-[3px] dark:bg-slate-900/60">
                <p className="text-[0.82rem] font-semibold leading-relaxed text-slate-600">
                  Your profile appears here once you have chosen how to start.
                </p>
              </div>
            )}
          </div>

          {!signedOut && state.accepted.photo && (
            <div className="mt-3">
              <PhotoPicker
                photo={state.accepted.photo}
                name={displayName}
                busy={uploading}
                uploadError={photoError}
                onPick={(blob) => void setPhoto(blob)}
              />
            </div>
          )}

          {/* Three angles on the same person. They pick - and the one they
              pick is the one the preview shows and the one Keep stores. */}
          {(state.suggested.headlineOptions?.length ?? 0) > 1 && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-surface p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                Three headlines. Pick one
              </p>
              <ul className="mt-2 grid gap-1.5">
                {state.suggested.headlineOptions!.map((option) => {
                  const on = option === state.suggested.headline;
                  return (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => chooseHeadline(option)}
                        className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-[0.82rem] leading-snug transition-colors ${
                          on
                            ? "border-brand-teal bg-teal-50/60 text-brand-ink"
                            : "border-slate-200 text-slate-600 hover:border-brand-teal/50"
                        }`}
                      >
                        {option}
                        <span className="mt-0.5 block text-[0.68rem] text-slate-400">
                          {option.length} characters
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Keeping is per section and by hand. A profile that applied
              itself is one somebody will be asked about and cannot explain. */}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-surface p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
              Keep what is right
            </p>
            <ul className="mt-2 grid gap-2">
              {SECTIONS.map((section) => {
                const suggested = state.suggested[section.id];
                const kept = sameValue(suggested, state.accepted[section.id]);
                const has = suggested !== undefined;
                return (
                  <li
                    key={section.id}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="min-w-0 flex-1 text-[0.85rem] font-semibold text-brand-ink">
                      {section.name}
                    </span>
                    {!has ? (
                      <span className="text-[0.78rem] text-slate-400">
                        Nothing written
                      </span>
                    ) : kept ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-teal-800 ring-1 ring-inset ring-teal-600/25">
                        <Check size={9} /> Kept
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void accept(section.id)}
                        className="inline-flex min-h-9 cursor-pointer items-center rounded-lg bg-brand-teal-deep px-3.5 text-[0.76rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-40"
                      >
                        {busy === section.id ? "Keeping…" : "Keep this"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2.5 text-[0.78rem] leading-relaxed text-slate-500">
              Nothing here is on LinkedIn until you copy it across. Check every
              line against something you actually did. If a sentence describes
              somebody slightly better than you, cut it.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
