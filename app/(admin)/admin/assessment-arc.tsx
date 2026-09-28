"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminArcPrompt,
  adminArcIndustries,
  adminGenerateArc,
  adminGenerateArcImages,
  sceneImageSrc,
  type ArcBank,
  type ArcTeam,
  type AssessmentArc,
  type ArcScene,
} from "@/lib/api";

import { assessmentQuestionCards, formatAssessmentScene } from "@/features/assessment";
import { importAssessmentWording } from "@/features/assessment";
import { AssessmentInteractionEditor } from "./assessment-interaction-editor";

// Authoring the first thirty days, per role.
//
// The two prompts are the point of this screen, and they are shown as two
// different things rather than one box:
//
//   The built-in prompt is the product's opinion about what an assessment is -
//   a workplace scenario with varied response formats, support that thins,
//   one repeated scene, every skill covered. It is read-only and it is on
//   screen. An instruction an admin is held to but cannot read turns authoring
//   into guesswork, and they end up fighting rules they cannot see.
//
//   The optional prompt is theirs, and it is explicitly subordinate: guidance
//   that would break a built-in rule is refused rather than followed. That is
//   said above the box, not discovered afterwards.
//
// What comes back is a draft. The warnings under it are the coverage check -
// a skill no scene measures cannot be stamped in a Passport, and publishing
// over that quietly is how a Passport ends up with a page nobody can defend.

export function AssessmentArcEditor({
  bank,
  roles,
  skillsForRole,
  aiConfigured,
  token,
  onChange,
}: {
  bank: ArcBank;
  /** Published roles, so an arc is written against a real one. */
  roles: Array<{ id: string; title: string; summary?: string }>;
  /** The skills a role needs — the arc has to cover all of them. */
  skillsForRole: (roleId: string) => string[];
  aiConfigured: boolean;
  token: () => Promise<string | null>;
  onChange: (next: ArcBank) => void;
}) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [guidance, setGuidance] = useState("");
  const [builtIn, setBuiltIn] = useState<string | null>(null);
  const [showBuiltIn, setShowBuiltIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  // How many scenes to write. A sitting uses twelve untimed questions;
  // the pool is larger so the sitting can be chosen from it, two people do not
  // get the same scenes, and somebody can sit it twice.
  const [want, setWant] = useState(60);
  // How many workplaces. 0 means "you choose" - the model picks two or three
  // from what actually hires for the role, which is right more often than a
  // number typed without knowing the industry.
  const [teams, setTeams] = useState(0);
  // What the role can actually support, asked before a number is picked.
  const [possible, setPossible] = useState<ArcTeam[] | null>(null);
  const [asking, setAsking] = useState(false);
  const [drawing, setDrawing] = useState<string | null>(null);
  // Elapsed seconds while writing. The pool is written server-side in batches
  // of six, each taking about a minute, so sixty scenes is ten minutes of one
  // unchanging button - which reads as a hang. A clock that moves is the
  // difference between "it is working" and "it has died".
  const [elapsed, setElapsed] = useState(0);

  const role = roles.find((r) => r.id === roleId) ?? null;
  // Memoised because generate() depends on it: a fresh array every render
  // would rebuild the callback on every keystroke in the guidance box.
  const skills = useMemo(
    () => (roleId ? skillsForRole(roleId) : []),
    [roleId, skillsForRole],
  );
  const existing = bank.arcs.find((a) => a.roleId === roleId) ?? null;

  // A clock while it writes. The pool is written server-side in batches of
  // six, each about a minute, so sixty scenes is ten minutes of one unchanging
  // button - which reads as a hang rather than as work.
  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const id = setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [busy]);

  // Fetched rather than duplicated in the frontend: one copy of the built-in
  // prompt, on the server, or this screen and the model drift apart.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t) return;
      const result = await adminArcPrompt(t);
      if (!cancelled && result) setBuiltIn(result.prompt);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const generate = useCallback(async () => {
    if (!role) return;
    setBusy(true);
    setError(null);
    setWarnings([]);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const result = await adminGenerateArc(t, {
      roleId: role.id,
      roleTitle: role.title,
      roleSummary: role.summary,
      skills,
      guidance: guidance.trim() || undefined,
      want,
      teams: teams > 0 ? teams : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setWarnings(result.warnings);
    onChange({
      arcs: [
        result.arc,
        ...bank.arcs.filter((a) => a.roleId !== result.arc.roleId),
      ],
    });
  }, [role, skills, guidance, want, teams, token, bank.arcs, onChange]);

  /**
   * Draw a picture for each scene that has none.
   *
   * Never automatic: a picture costs money and most scenes are better without
   * one, so it happens when somebody asks and only for scenes still missing
   * it. Four per request because a single draw takes about fifteen seconds and
   * a request that runs for a minute times out somewhere - so the loop is here
   * where the progress is visible, not on the server.
   */
  const askIndustries = useCallback(async () => {
    if (!role) return;
    setAsking(true);
    setPossible(null);
    const t = await token();
    if (!t) {
      setAsking(false);
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const result = await adminArcIndustries(t, {
      roleTitle: role.title,
      roleSummary: role.summary,
      guidance: guidance.trim() || undefined,
    });
    setAsking(false);
    setPossible(result?.teams ?? []);
  }, [role, guidance, token]);

  const drawPictures = useCallback(async () => {
    if (!existing) return;
    const t = await token();
    if (!t) {
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    // Only the scenes the writer marked as worth looking at. Drawing all of
    // them was both the bill and the rate limit: sixty pictures asked for when
    // perhaps a dozen are situations you would actually look at.
    const todo = existing.scenes.filter((sc) => sc.needsImage && !sc.image);
    if (todo.length === 0) {
      const marked = existing.scenes.filter((sc) => sc.needsImage).length;
      setError(
        marked === 0
          ? "No scene in this pool is one you would look at, so there is nothing to draw. That is normal — most scenes are a conversation or a piece of writing."
          : "Every scene that needs a picture already has one.",
      );
      return;
    }
    setError(null);
    // Image generation is rate limited, hard, so this is deliberately NOT
    // all-at-once. Firing fifteen batches together is sixty pictures asked for
    // in the same second, and OpenAI answers that with 429s - which is what
    // "0 drawn" turned out to be. Two batches in flight is eight pictures at a
    // time, which the limit tolerates, and a batch that is refused is retried
    // once after a pause rather than handed back to you to press again.
    const batches: Array<typeof todo> = [];
    for (let i = 0; i < todo.length; i += 4) batches.push(todo.slice(i, i + 4));

    const drawn = new Map<string, string>();
    let firstError: string | undefined;
    let done = 0;

    const runBatch = async (batch: typeof todo, isRetry: boolean) => {
      const result = await adminGenerateArcImages(
        t,
        // The picture's own description, not the task. "Write back to the
        // customer" draws nothing; "a courier counter at 9pm, three parcels
        // open, one crushed" draws the thing they are looking at.
        batch.map((sc) => ({
          id: sc.id,
          scene: sc.imageBrief || `${sc.title}. ${sc.brief}`,
        })),
      );
      done += batch.length;
      setDrawing(`${Math.min(done, todo.length)} of ${todo.length}`);
      if (!result) {
        firstError ??= "the illustrator could not be reached";
        return false;
      }
      let anyRateLimit = false;
      for (const img of result.images) {
        const src = sceneImageSrc(img);
        if (src) drawn.set(img.id, src);
        else if ("error" in img) {
          firstError ??= img.error;
          if (/rate limit|429/i.test(img.error)) anyRateLimit = true;
        }
      }
      // Only a rate limit is worth retrying; a refusal or a bad prompt will
      // fail again just as fast.
      return anyRateLimit && !isRetry;
    };

    const IN_FLIGHT = 2;
    const toRetry: Array<typeof todo> = [];
    setDrawing(`0 of ${todo.length}`);
    for (let i = 0; i < batches.length; i += IN_FLIGHT) {
      const slice = batches.slice(i, i + IN_FLIGHT);
      const outcomes = await Promise.all(
        slice.map((batch) => runBatch(batch, false)),
      );
      outcomes.forEach((again, j) => {
        if (again) toRetry.push(slice[j]!);
      });
    }

    if (toRetry.length > 0) {
      setDrawing(`waiting out the rate limit…`);
      await new Promise((r) => setTimeout(r, 20000));
      done = todo.length - toRetry.reduce((n, b) => n + b.length, 0);
      // One retry each, sequentially - the whole point is to stop asking for
      // several at once.
      for (const batch of toRetry) await runBatch(batch, true);
    }

    setDrawing(null);
    const missed = todo.length - drawn.size;
    if (drawn.size === 0) {
      setError(
        firstError
          ? `Nothing drew — ${firstError}. Rate limits ease off after a minute; press again and it will pick up where it stopped.`
          : "Nothing drew, and the illustrator gave no reason. Check OPENAI_API_KEY on the server.",
      );
    } else if (missed > 0) {
      setError(
        `${drawn.size} drawn, ${missed} still to go${
          firstError ? ` — ${firstError}` : ""
        }. What drew is kept; press again for the rest.`,
      );
    }
    if (drawn.size > 0) {
      onChange({
        arcs: bank.arcs.map((a) =>
          a.roleId === existing.roleId
            ? {
                ...a,
                scenes: a.scenes.map((sc) =>
                  drawn.has(sc.id) ? { ...sc, image: drawn.get(sc.id) } : sc,
                ),
              }
            : a,
        ),
      });
    }
  }, [existing, token, bank.arcs, onChange]);


  const patchScene = useCallback(
    (arc: AssessmentArc, index: number, patch: Partial<ArcScene>) => {
      onChange({
        arcs: bank.arcs.map((a) =>
          a.roleId === arc.roleId
            ? {
                ...a,
                scenes: a.scenes.map((s, i) =>
                  i === index ? { ...s, ...patch } : s,
                ),
              }
            : a,
        ),
      });
    },
    [bank.arcs, onChange],
  );

  const total = existing?.scenes.reduce((sum, s) => sum + s.minutes, 0) ?? 0;

  return (
    <section className="mt-5">
      <h2 className="text-lg font-semibold text-slate-900">
        Assessment — workplace scenario builder
      </h2>
      <p className="mt-1 max-w-3xl text-[0.88rem] leading-relaxed text-slate-600">
        Build a pool of real situations for this role. Each student answers 8 questions
        with no time limit. Keep at least 8 questions per workplace. Mix action cards,
        priorities, handovers and spoken updates where they fit the work. Keep each
        brief short and map the evidence to the skills it demonstrates.
      </p>

      {/* ---- role ---- */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-[0.8rem] font-semibold text-slate-700">
          Role
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="mt-1 block min-h-10 min-w-56 rounded-lg border border-slate-300 bg-surface px-2.5 text-[0.85rem]"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[0.8rem] text-slate-500">
          {skills.length > 0
            ? `${skills.length} skills to cover: ${skills.join(", ")}`
            : "This role has no skills yet — give it skills first."}
        </p>
      </div>

      {/* ---- the built-in prompt ---- */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-500">
            Built-in prompt · always applied · not editable
          </p>
          <button
            type="button"
            onClick={() => setShowBuiltIn((v) => !v)}
            className="cursor-pointer text-[0.78rem] font-semibold text-brand-violet-deep"
          >
            {showBuiltIn ? "Hide it" : "Read it"}
          </button>
        </div>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-600">
          The server supplies the generation instructions below. Review generated
          drafts for realistic workplace situations, suitable response formats and
          skill coverage before publishing. The response builder below lets you
          edit each work moment without changing the role or its skill mapping.
        </p>
        {showBuiltIn && (
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-surface p-3 font-sans text-[0.76rem] leading-relaxed text-slate-600">
            {builtIn ?? "Loading…"}
          </pre>
        )}
      </div>

      {/* ---- the optional prompt ---- */}
      <div className="mt-3">
        <label
          htmlFor="arc-guidance"
          className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-500"
        >
          Your prompt · optional
        </label>
        <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">
          Add what this role or employer needs — the industry&apos;s own
          vocabulary, a constraint that matters, a scene you want included.
          Anything here that would break a built-in rule is ignored rather than
          followed.
        </p>
        <textarea
          id="arc-guidance"
          rows={3}
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="e.g. this employer runs a franchise model, so the scenes should involve store owners rather than head office"
          className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] leading-relaxed"
        />
      </div>

      <label className="mt-3 flex flex-wrap items-center gap-2 text-[0.8rem] text-slate-600">
        <span className="font-semibold">Scenes to write</span>
        <input
          type="number"
          min={1}
          max={80}
          value={want}
          onChange={(e) => setWant(Number(e.target.value) || 1)}
          className="w-20 rounded-lg border border-slate-300 bg-surface px-2 py-1 text-[0.85rem]"
        />
        <span className="font-semibold">across</span>
        <select
          value={teams}
          onChange={(e) => setTeams(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-surface px-2 py-1 text-[0.85rem]"
        >
          <option value={0}>however many industries fit</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "industry" : "industries"}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={asking || !aiConfigured || !role}
          onClick={() => void askIndustries()}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-[0.78rem] font-semibold text-brand-violet-deep hover:bg-surface disabled:opacity-50"
        >
          {asking ? "Asking…" : "Which industries hire for this?"}
        </button>
        {possible !== null && (
          <span className="w-full text-[0.8rem] text-slate-600">
            {possible.length === 0
              ? "Could not work that out — pick a number yourself."
              : `${possible.length} industr${possible.length === 1 ? "y" : "ies"} hire for this role: ${possible
                  .map((t) => t.industry || t.company)
                  .join(", ")}. Asking for more than ${possible.length} would mean inventing one, so it will return ${possible.length}.`}
          </span>
        )}
        <span className="w-full text-slate-400">
          A pool, not a sitting — a student is served whatever fits fifteen
          minutes, all of it from one industry. The number is split across the
          industries and rounded up, so each has enough to fill a sitting on
          its own. You can also just say it in the box below.
        </span>
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !aiConfigured || skills.length === 0}
          onClick={() => void generate()}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-brand-violet px-4 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-40"
        >
          {busy
            ? `Writing ${want} scenes… ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
            : existing
              ? "Write them again"
              : "Write this role's scenes"}
        </button>
        {busy && (
          <span className="text-[0.8rem] text-slate-500">
            Written six at a time, about a minute each — roughly{" "}
            {Math.max(1, Math.ceil(want / 6))} minutes for {want}. Leave this
            tab open.
          </span>
        )}
        {!aiConfigured && (
          <span className="text-[0.8rem] text-slate-500">
            No AI key configured on the server.
          </span>
        )}
        {existing && (
          <button
            type="button"
            disabled={busy || drawing !== null}
            onClick={() => void drawPictures()}
            className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 px-3 text-[0.82rem] font-semibold text-slate-700 transition-colors hover:bg-surface disabled:opacity-40"
          >
            {drawing
              ? `Drawing ${drawing}…`
              : `Draw the ${existing.scenes.filter((sc) => sc.needsImage && !sc.image).length} that need it`}
          </button>
        )}
        {existing && (
          <span className="text-[0.8rem] text-slate-500">
            {existing.scenes.length} scenes · {total} minutes ·{" "}
            {existing.company} ·{" "}
            {existing.scenes.filter((sc) => sc.image).length} of{" "}
            {existing.scenes.filter((sc) => sc.needsImage).length} pictures
            drawn
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.83rem] leading-relaxed text-amber-900">
          {error}
        </p>
      )}

      {/* Warnings, not blocks. An admin who wants a five-scene arc for a simple
          role should be able to publish one - but never by accident. */}
      {warnings.length > 0 && (
        <ul className="mt-3 grid gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
          {warnings.map((w) => (
            <li
              key={w}
              className="text-[0.83rem] leading-relaxed text-amber-900"
            >
              {w}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-4 rounded-xl border border-violet-700/40 bg-violet-50 p-4 text-sm text-slate-900">
        <h3 className="font-semibold">One question, context cards, then the student’s answer</h3>
        <p className="mt-2">Buddy assistance is disabled. The server offers AI on the first two questions in each sitting; every later question is independent. Pool order does not decide the assistance allowance.</p>
        <p className="mt-2">Convert the existing wording into cards while preserving scenario facts and removing explicit help-availability notices, then edit the short question and cards below. Existing answers keep their original assessment snapshot.</p>
        <button type="button" disabled={busy || !bank.arcs.length} onClick={() => {
          onChange({ arcs: bank.arcs.map(arc => ({ ...arc, scenes: arc.scenes.map(formatAssessmentScene) })) });
        }} className="mt-3 min-h-11 rounded-lg border border-slate-300 bg-surface px-4 text-sm font-semibold text-slate-900 disabled:opacity-40">Convert all existing questions to cards</button>
        <p className="mt-2 text-xs">Updates the draft for all {bank.arcs.length} roles. Use Publish to make the revised question bank available.</p>
        <label className="mt-4 block text-sm font-semibold">Import reviewed wording (local JSON)
          <input type="file" accept=".json,application/json" disabled={busy} className="mt-2 block w-full min-h-11 text-xs" onChange={async event => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              if (file.size > 10_000_000) throw new Error("Choose a wording file smaller than 10 MB.");
              const result = importAssessmentWording(bank, JSON.parse(await file.text()));
              onChange(result.bank);
              setError(null);
              setWarnings([`${result.changed} question briefs imported locally. Skills, scoring criteria and response formats are unchanged. Review, Save draft, then Publish.`]);
            } catch (error) { setError(error instanceof Error ? error.message : "Could not read this wording file."); }
          }} />
        </label>
        <p className="mt-1 text-xs">No AI request. Each update must match the current original wording; conflicting edits are rejected together.</p>
      </section>

      {/* ---- the arc ---- */}
      {existing && (
        <ol className="mt-4 grid gap-2.5">
          {existing.scenes.map((scene, i) => (
            <li
              key={scene.id}
              className="rounded-xl border border-slate-200 bg-surface p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label="Work moment or day"
                  value={scene.day}
                  onChange={(e) =>
                    patchScene(existing, i, { day: e.target.value })
                  }
                  className="min-h-8 w-24 rounded-md border border-slate-300 px-2 text-[0.8rem] font-bold"
                />
                <input
                  aria-label="Scenario title"
                  value={scene.title}
                  onChange={(e) =>
                    patchScene(existing, i, { title: e.target.value })
                  }
                  className="min-h-8 min-w-48 flex-1 rounded-md border border-slate-300 px-2 text-[0.85rem] font-semibold"
                />
                <span className="rounded-full bg-violet-50 px-2 py-1 text-xs text-violet-900">AI on delivered questions 1–2 only</span>
                <span className="text-[0.75rem] text-slate-500">
                  {scene.minutes} min · {scene.answer}
                  {scene.repeatsSceneId
                    ? ` · repeats ${scene.repeatsSceneId}`
                    : ""}
                </span>
              </div>

              <QuestionCardsEditor brief={scene.brief} onChange={brief => patchScene(existing, i, { brief })} />

              <AssessmentInteractionEditor scene={scene} onChange={(patch) => patchScene(existing, i, patch)} />

              {/* The picture, if this scene has one. It was drawn, counted and
                  saved, and never shown - so "Draw the scenes that need it"
                  finished with nothing to see and no way to tell a good draw
                  from a bad one before publishing it to students. */}
              {scene.image && (
                <div className="mt-2 flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scene.image}
                    alt={`Scene: ${scene.title}`}
                    className="h-28 w-auto rounded-md border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchScene(existing, i, { image: undefined })
                    }
                    className="text-[0.75rem] font-semibold text-slate-400 hover:text-rose-600"
                  >
                    Remove picture
                  </button>
                </div>
              )}

              {scene.fields.length > 0 && (
                <ul className="mt-1.5 grid gap-1">
                  {scene.fields.map((f) => (
                    <li key={f} className="text-[0.78rem] text-slate-500">
                      Deliverable: {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {scene.measures.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-semibold text-slate-600"
                  >
                    {m}
                  </span>
                ))}
              </div>

              {(scene.easier || scene.harder) && (
                <p className="mt-1.5 text-[0.75rem] leading-snug text-slate-400">
                  {scene.easier && <>Easier: {scene.easier} </>}
                  {scene.harder && <>· Harder: {scene.harder}</>}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function QuestionCardsEditor({ brief, onChange }: { brief: string; onChange: (brief: string) => void }) {
  const parts = assessmentQuestionCards(brief);
  const write = (question: string, cards: typeof parts.cards) => onChange(question + "\n\n" + cards.map(card => `### ${card.title}\n${card.body}`).join("\n\n"));
  const input = "mt-1 block w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm text-slate-900";
  return <div className="mt-3">
    <label className="block text-xs font-semibold text-slate-700">The question<textarea rows={2} value={parts.question} onChange={event => write(event.target.value, parts.cards)} className={input} /></label>
    <p className="mt-1 text-xs text-slate-500">Write for a student with no work experience: one question under 30 words, then 2–3 concise cards. Aim for 100–160 words overall; keep longer tables or messages when they are needed. Define unfamiliar terms. Remove scene-setting, never facts needed to answer.</p>
    <p className="mt-1 text-xs text-slate-600">{parts.question.trim().split(/\s+/).filter(Boolean).length} words in the question · {brief.trim().split(/\s+/).filter(Boolean).length} words including cards</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">{parts.cards.map((card, index) => <div key={index} className="rounded-lg border border-slate-200 p-3">
      <label className="block text-xs text-slate-600">Card {index + 1} title<input value={card.title} className={input} onChange={event => write(parts.question, parts.cards.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} /></label>
      <label className="mt-2 block text-xs text-slate-600">Facts or message<textarea value={card.body} rows={4} className={input} onChange={event => write(parts.question, parts.cards.map((item, i) => i === index ? { ...item, body: event.target.value } : item))} /></label>
      <button type="button" disabled={parts.cards.length <= 1} className="mt-2 min-h-11 text-xs text-slate-600 disabled:opacity-40" onClick={() => write(parts.question, parts.cards.filter((_, i) => i !== index))}>Remove card</button>
    </div>)}</div>
    <button type="button" disabled={parts.cards.length >= 6} className="mt-2 min-h-11 text-xs font-semibold text-violet-700 disabled:opacity-40" onClick={() => write(parts.question, [...parts.cards, { title: "More context", body: "" }])}>Add context card</button>
  </div>;
}
