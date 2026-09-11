# Proposed student plans — 11 September 2026

This is a launch hypothesis for testing, not a profitability guarantee. The user clarified that the highest plan must include the AI interview bot and other preparation tools. The earlier ₹399 application-only idea is superseded by Career Pro at ₹499.

| Included per 30-day pass | Resume Starter ₹99 | Resume Plus ₹199 | Career Pro ₹499 |
| --- | --- | --- | --- |
| Templates | 3 existing | 6 total, after 3 more ship | All 6 |
| New AI resume drafts | 1 | 3 | 5 |
| Successful resume AI improvements | 5 | 15 | 30 |
| Resume feedback | Included | Included | Included |
| Manual edits and saved-document downloads | Included | Included | Included |
| LinkedIn profile generation | — | — | 1 + 5 AI revisions |
| Job-fit checks | — | — | 5 |
| AI mock interviews | — | — | 2 sessions, 10 minutes each |
| Readiness assessment | — | — | 1 |
| Focused practice question sets | — | — | 5 |

Use one-time payments, no automatic renewal. Show tax-inclusive totals after confirming the business's applicable tax treatment. Keep core career discovery, account/profile record and previously saved artifacts accessible; do not charge the same student again just to reopen a paid result. Access to tool categories is broad in Career Pro; AI consumption is bounded. Avoid the phrase “unlimited full access.” No human review, job guarantee or access to all future features is included.

The current product has only three resume templates. Six is a proposed entitlement, not a feature that can be sold before it exists and has been checked in the actual PDF/Word renderer. Upgrades should offer more useful work as well as layouts: students already have free template alternatives.

## Entry and payment experience

- Build resume → show the three plans before asking the student to invest time entering details. Show the same prices to signed-out and signed-in users without an active entitlement.
- Signed-out: select a plan → sign in/create account → restore selection → show total → secure checkout → return to builder.
- Signed-in: select plan → show total → secure checkout → return to builder.
- Active plan with available allowance: open the builder directly. Show plan/remaining allowance unobtrusively. Do not repeatedly force a paid customer through a purchase screen.
- Expired or exhausted allowance: preserve the draft, explain the limit, offer renewal or upgrade. Allow viewing/downloading existing work.
- Upgrade during the same pass: charge only the difference, keep the original expiry, and carry usage forward against the higher plan's total allowance. Upgrading must not reset consumed usage.
- Count only successful user-visible work against allowances. Replays, downloads, layout switches, manual edits and retries after product failure are not new paid AI actions. Use backend idempotency so retries cannot double-charge or double-consume.
- “Feedback included” needs a bounded backend policy: review each new draft and the final revised version; reuse a current review for unchanged content. Account for any automatically repeated review calls in the plan's cost budget.
- Define a practice set before launch (for example, up to 10 existing-bank questions and one supported feedback result). Do not market future coaching or custom simulation capabilities as already available.

The preview at `/preview-resume-plans` simulates the states only. It does not authenticate, collect payment details, create a checkout session, grant access or debit credits. In production, prices, entitlements, checkout creation, payment verification/webhooks, usage reservations and refunds belong in the backend. A frontend plan query parameter must never authorize a paid operation. Do not replace live Build buttons until the approved product and backend work is ready.

## Contribution targets

For a conservative tax-inclusive scenario, model 18% sales tax and Razorpay's standard domestic fee of 2% plus 18% GST on that fee (2.36% of gross). Sales tax treatment must be confirmed separately; GST on the payment fee does not determine GST on the product. No payment-fee input-tax credit is assumed below.

| Per purchase | Starter | Plus | Career Pro |
| --- | ---: | ---: | ---: |
| Customer price | ₹99 | ₹199 | ₹499 |
| Revenue excluding modelled 18% sales tax | ₹83.90 | ₹168.64 | ₹422.88 |
| Payment fee including fee GST | ₹2.34 | ₹4.70 | ₹11.78 |
| Target maximum service-cost budget | ₹25 | ₹60 | ₹180 |
| Contribution before fixed costs and acquisition | ₹56.56 | ₹103.95 | ₹231.10 |

These service budgets are targets, not measured costs. They must cover AI text and voice, failed/retried requests, file generation, storage, attributable support and a refund allowance. Hosting minimums, salaries, development, acquisition and income tax still have to be paid from contribution. Actual profit = total contribution − fixed operating costs − acquisition costs. For example, the middle plan cannot sustain ₹104 of acquisition cost per purchase and still pay fixed costs at this target budget.

Do not use “₹499 gives ₹231 profit” in a business forecast. Measure cost by feature and per paid account, including heavy users, before launching. Use a paid pilot of roughly 30–50 students to test completion, purchase conversion, refunds and the cost of fully used allowances; this is a proposed validation step, not existing evidence of affordability. If full-allowance service cost exceeds the budget, reduce expensive allowances, optimise the implementation or increase the price before widening rollout.

## Cost evidence

Read-only source inspection found:

- Resume generation, revision and review: `claude-haiku-4-5-20251001`.
- LinkedIn writer/reviser and job-fit analysis: the same Haiku model.
- Interview reasoning: Haiku, with up to ten questions and a 600-second interview timebox.
- Interview speech: `gpt-4o-mini-tts`; transcription: `gpt-4o-mini-transcribe`. These are additional costs, not part of the Haiku call.
- Readiness review: `claude-opus-5`, with an output ceiling of 8,000 tokens. It must not be costed like a short Haiku call.

Official prices checked 11 September 2026:

- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing): Haiku 4.5 is $1 input / $5 output per million tokens. Opus 5 standard is $5 input / $25 output per million tokens. No cache/batch savings are assumed in the proposal.
- [OpenAI Mini TTS model pricing](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts): $0.60 per million input text tokens, $12 per million output audio tokens.
- [OpenAI pricing](https://developers.openai.com/api/docs/pricing): Mini Transcribe estimated cost $0.003 per audio minute. Voice playback retries and synthesis must be measured separately.
- [Razorpay pricing](https://razorpay.com/pricing/) and [domestic fee explanation](https://razorpay.com/solutions/e-commerce/): standard 2% platform fee plus GST; domestic example totals 2.36%. Do not base long-term margins on a temporary introductory gateway discount.
- [Kickresume student offer](https://www.kickresume.com/en/students/): eligible verified students/teachers can receive up to 180 days of Premium free. [Resumemaker.in](https://www.resumemaker.in/) also advertises free template-based resume creation. These are reasons to sell personalised help and preparation, not just access to a handful of layouts.

No provider billing logs, actual customer acquisition figures or support-cost data were available in this review, so profitability and willingness to pay remain unverified.
