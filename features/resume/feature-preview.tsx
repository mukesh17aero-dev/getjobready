"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkle } from "@/components/ui/icons";
import { DraftRequests } from "./draft-requests";
import { RecruiterReview } from "./recruiter-review";
import { ResumeSuggestions } from "./resume-suggestions";
import { SAMPLE_RESUME } from "./starter-resumes";
import type { ResumeReview, ResumeValidation } from "./resume-api";
import s from "./feature-preview.module.css";

// What an account adds, shown to a signed-out visitor as the real screens
// with sample content - so the preview can never drift from the product.
// Every preview is marked as an example, cannot be used (inert), and ends
// on one way in: an account.

export type PreviewKind = "draft" | "suggestions" | "review" | "polish";

const TITLE: Record<PreviewKind, string> = {
  draft: "Request changes",
  suggestions: "Suggestions",
  review: "AI Recruiter Review",
  polish: "Improve with AI",
};

const WHAT: Record<PreviewKind, string> = {
  draft: "Select any words on your resume, or tap a prompt, and say what should change. Collect them in one list, then regenerate the resume in one go.",
  suggestions: "Your finished resume is read once - spelling, grammar, dates that do not add up, screening checks, what would make it stronger - and you apply the fixes you want.",
  review: "A recruiter's read for your role: what they expect to see, what will stand out, what to change, and your next step.",
  polish: "Type rough pointers into a field, and they come back as resume lines you can use - nothing added that you did not say.",
};

const NOOP = () => {};

const SAMPLE_CHECK: ResumeValidation = {
  missing: [],
  ats: [{ label: "Measured lines", detail: "Only one of your four lines carries a figure.", ask: "A number you already know to be true - customers a day, team size, months." }],
  logic: [{ section: "achievements", where: "Achievements", detail: "\"Promotion expected in March 2026\" - that date has passed. If it happened, say so with its date; if not, take the line out.", needsFact: true }],
  corrections: [{ kind: "typo", section: "achievements", line: 0, before: "Recieved the store's best-employee award", after: "Received the store's best-employee award", why: "'recieved' is spelled 'received'." }],
  stronger: [{ what: "The billing line does not say how many customers you served.", how: "Add the number you know - for example, about 200 a day." }],
  fromRules: false,
};

const SAMPLE_REVIEW: ResumeReview = {
  expectations: [
    { what: "Customer issues resolved, with how many", shown: true },
    { what: "Billing or point-of-sale experience", shown: true },
    { what: "A result with a number", shown: false },
    { what: "The tools you used, by name", shown: false },
  ],
  strengths: ["Your store job shows real customer work every day.", "Your summary names the role you want."],
  redFlags: ["Adding how many customers a day to the store job line will show the scale of your work."],
  gaps: [],
  standing: { level: "competitive", why: "Real customer work is in place - a number or two would lift it further." },
  nextStep: { route: "readiness", why: "" },
  roleIdeas: [],
  coverage: { covered: [], missing: [] },
  fromRules: false,
};

function Body({ kind }: { kind: PreviewKind }) {
  if (kind === "draft") {
    return <DraftRequests editing onEdit={NOOP} disabled busy={false} reply="" canUndo={false} onUndo={NOOP} onAdd={NOOP} onRemove={NOOP} onRegenerate={NOOP} onContinue={NOOP}
      requests={[
        { id: 1, quote: "Handled billing at the counter", where: "Experience · entry 1", ask: "Say I handled about 200 customers a day" },
        { id: 2, quote: "", where: "Whole resume", ask: "Keep it to one page" },
      ]} />;
  }
  if (kind === "suggestions") {
    return <ResumeSuggestions sample={SAMPLE_CHECK} active resume={SAMPLE_RESUME} template="classic" getToken={async () => null} onAsk={async () => null} onApply={NOOP} onUndo={NOOP} onOpenSection={NOOP} disabled />;
  }
  if (kind === "review") {
    return <RecruiterReview review={SAMPLE_REVIEW} next={{ kind: "readiness", roleId: "customer_support", roleTitle: "Customer Support Associate" }} role="Customer Support Associate" />;
  }
  return <div className={s.polish}>
    <span className={s.fieldLabel}>What you did</span>
    <p className={s.field}>billing, around 200 customers daily, stock check, closing report</p>
    <span className={s.improve}><Sparkle size={16} />Improve with AI</span>
    <div className={s.suggestion}>
      <strong>Suggested wording</strong>
      <p>Billed around 200 customers a day at the counter.{"\n"}Checked stock daily and prepared the closing report.</p>
      <span className={s.buttons}><b>Use this</b><i>Keep mine</i></span>
    </div>
  </div>;
}

/** One feature, previewed: what it does, the real screen with sample content, and the way in. */
export function FeaturePreview({ kind }: { kind: PreviewKind }) {
  return <section className={s.preview} aria-label={`${TITLE[kind]} - example`}>
    <div className={s.head}><span className={s.example}>Example</span><h3>{TITLE[kind]}</h3></div>
    <p className={s.what}>{WHAT[kind]}</p>
    {/* Shown, not usable: the sample is there to look at. */}
    <div className={s.screen} inert><Body kind={kind} /></div>
    <Link className={s.cta} href="/signup?next=%2Fresume%2Fbuild">Create an account to use this</Link>
  </section>;
}

/** Every feature an account adds, one at a time. */
export function FeatureTour() {
  const [kind, setKind] = useState<PreviewKind>("draft");
  return <div className={s.tour}>
    <div className={s.tabs} role="group" aria-label="What you get with an account">
      {(Object.keys(TITLE) as PreviewKind[]).map(id => <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>{TITLE[id]}</button>)}
    </div>
    <FeaturePreview kind={kind} />
  </div>;
}
