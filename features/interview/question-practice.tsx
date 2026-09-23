"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { answerPracticeQuestion, type LibraryQuestion, type QuestionLibrary, type QuestionState } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import s from "./interview-workspace.module.css";

// Question practice, as approved in the interview workspace preview: search,
// round and competency filters, plain status labels, two cards to a row on a
// desktop and six to a page. Pressing a card opens the answer sheet; one note
// comes back per answer, never a report.
//
// Signed out the whole library reads. The account is asked for at the one
// point that costs something: sending an answer to be read.

const STATUS: Record<QuestionState, { word: string; tone: string }> = {
  weak: { word: "Needs practice", tone: "amber" },
  unattempted: { word: "Not tried yet", tone: "neutral" },
  solid: { word: "Holding up", tone: "earned" },
};
const ORDER: Record<QuestionState, number> = { weak: 0, unattempted: 1, solid: 2 };
const MIN_ANSWER = 80;
const PER_PAGE = 6;

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function QuestionPractice({ initial, signedOut = false, openId }: { initial: QuestionLibrary; signedOut?: boolean; openId?: string }) {
  const [library, setLibrary] = useState(initial);
  const [search, setSearch] = useState("");
  const [round, setRound] = useState<"all" | "hr" | "managerial">("all");
  const [competency, setCompetency] = useState("all");
  const [status, setStatus] = useState<"all" | QuestionState>("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<LibraryQuestion | null>(() => initial.questions.find(q => q.id === openId) ?? null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ note: string | null; heldUp: boolean | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GatedAction | null>(null);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return library.questions
      .filter(q => round === "all" || q.round === round)
      .filter(q => competency === "all" || q.competency === competency)
      .filter(q => status === "all" || q.state === status)
      .filter(q => !needle || q.q.toLowerCase().includes(needle) || q.competency.toLowerCase().includes(needle))
      .sort((a, b) => ORDER[a.state] - ORDER[b.state]);
  }, [library.questions, search, round, competency, status]);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);
  const counts = { weak: library.questions.filter(q => q.state === "weak").length, unattempted: library.questions.filter(q => q.state === "unattempted").length };

  // The sheet is a dialog: Escape closes it and the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);

  function start(q: LibraryQuestion) { setOpen(q); setAnswer(""); setResult(null); setError(null); }
  async function send() {
    if (!open) return;
    if (signedOut) {
      setGate({ what: "a read on your answer", why: "Someone has to listen to what you said and tell you the one thing that would make it land better, which needs an account, and means the answer is still here next time." });
      return;
    }
    if (answer.trim().length < MIN_ANSWER) return;
    setBusy(true); setError(null);
    const t = await token();
    if (!t) { setBusy(false); setError("Your session expired. Reload the page and sign in again."); return; }
    const attempt = await answerPracticeQuestion(t, open.id, answer.trim());
    setBusy(false);
    if (!attempt) { setError("Could not send that. Try again in a moment."); return; }
    setResult({ note: attempt.note, heldUp: attempt.heldUp });
    setLibrary(lib => ({ ...lib, questions: lib.questions.map(q => q.id === open.id ? { ...q, state: attempt.heldUp === true ? "solid" : "weak", attempts: q.attempts + 1, note: attempt.note } : q) }));
  }
  const left = MIN_ANSWER - answer.trim().length;
  const filtersOn = search.trim() || round !== "all" || competency !== "all" || status !== "all";

  return <>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    <div className={s.questionToolbar}>
      <label><span className={s.srOnly}>Search questions</span><input type="search" value={search} placeholder="Search a question or competency…" onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
      <label><span className={s.srOnly}>Interview round</span><select value={round} onChange={e => { setRound(e.target.value as "all" | "hr" | "managerial"); setPage(0); }}><option value="all">All rounds</option><option value="hr">HR round</option><option value="managerial">Managerial round</option></select></label>
      <label><span className={s.srOnly}>Competency</span><select value={competency} onChange={e => { setCompetency(e.target.value); setPage(0); }}><option value="all">All competencies</option>{library.competencies.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
    </div>
    <div className={s.filters} aria-label="Question status">{([["all", "All questions"], ["weak", `Needs practice${counts.weak ? ` · ${counts.weak}` : ""}`], ["unattempted", `Not tried yet${counts.unattempted ? ` · ${counts.unattempted}` : ""}`], ["solid", "Holding up"]] as Array<["all" | QuestionState, string]>).map(([id, label]) => <button type="button" key={id} aria-pressed={status === id} onClick={() => { setStatus(id); setPage(0); }}>{label}</button>)}</div>
    {visible.length === 0 ? <section className={`${s.card} ${s.libraryEmpty}`}><h2>No questions match these filters.</h2><p>Try a broader search or reset the filters.</p>{filtersOn && <button type="button" className={s.secondary} onClick={() => { setSearch(""); setRound("all"); setCompetency("all"); setStatus("all"); setPage(0); }}>Reset filters</button>}</section>
      : <div className={s.questionGrid}>{visible.map(q => <button type="button" key={q.id} className={s.qCard} onClick={() => start(q)}><div className={s.top}><span className={s.round}>{q.round === "hr" ? "HR ROUND" : "MANAGERIAL ROUND"}</span><span className={`${s.chip} ${s[STATUS[q.state].tone]}`}>{STATUS[q.state].word}</span></div><h2>{q.q}</h2><p>{q.state === "weak" && q.note ? q.note : q.testing}</p><div className={s.bottom}><span>{q.competency}{q.hasStory ? " · you have a story" : ""}</span><b aria-hidden="true">↗</b></div></button>)}</div>}
    <div className={s.pagination}><span role="status">{shown.length} {shown.length === 1 ? "question" : "questions"} · page {current + 1} of {pages}</span><div><button type="button" disabled={current === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Previous</button><button type="button" disabled={current >= pages - 1} onClick={() => setPage(p => p + 1)}>Next →</button></div></div>

    {open && <div className={s.sheet} role="dialog" aria-modal="true" aria-label={open.q} onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}><div>
      <span className={s.chip}>{open.round === "hr" ? "HR ROUND" : "MANAGERIAL ROUND"} · {open.competency}</span>
      <h2>{open.q}</h2>
      <p><strong>What it is testing:</strong> {open.testing}</p>
      {result ? <>
        {result.heldUp && !result.note ? <div className={s.questionFeedback}><p className={s.eyebrow}>THAT WOULD HOLD UP</p><h3>An interviewer would move on rather than press.</h3><p>Nothing to change. Your answer is kept, so the next attempt has something to be better than.</p></div>
          : <div className={s.questionFeedback}><p className={s.eyebrow}>ONE THING TO TAKE INTO YOUR NEXT ATTEMPT</p><h3>{result.note ?? "Say more about what you actually did."}</h3><p>Your answer is kept, so the next attempt has something to be better than.</p></div>}
        <div className={s.sheetActions}><button type="button" className={s.secondary} onClick={() => { setResult(null); setAnswer(""); }}>Answer it again</button><Link className={s.primary} href={`/interview/practice?focus=${encodeURIComponent(`${open.competency}: ${open.testing}`)}`}>Try it in a mock interview →</Link><button type="button" className={s.textButton} onClick={() => setOpen(null)}>Next question</button></div>
      </> : <>
        <label className={s.field} style={{ marginTop: 19 }}><span>Your answer</span><textarea value={answer} disabled={busy} placeholder="Use a real experience. Say what you did and what happened…" onChange={e => setAnswer(e.target.value)} /><small>{left > 0 ? `${left} more characters. A few sentences is plenty.` : "Long enough. One note comes back, not a report."}</small></label>
        <details className={s.storyPeek}><summary>A starting structure <span>+</span></summary><p>Set the scene briefly. Explain your own action. End with what happened or what you learned.</p></details>
        {error && <p className={s.status} role="alert">{error}</p>}
        <div className={s.sheetActions}><button type="button" className={s.textButton} onClick={() => setOpen(null)}>Close</button><button type="button" className={s.primary} disabled={busy || (!signedOut && left > 0)} onClick={() => void send()}>{busy ? "Reading it…" : signedOut ? "Sign in to see how it landed →" : "See how it landed →"}</button></div>
      </>}
    </div></div>}
  </>;
}
