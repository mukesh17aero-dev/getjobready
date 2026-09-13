# Cost of one role simulation

Basis: Customer Success Associate, 10 skills, 30 missions and three complete baseline/reassessment sets (12 questions per sitting). This is software usage cost, excluding development, human review, hosting, storage, bandwidth, payment charges and tax. INR figures use an illustrative ₹90/USD, not a live exchange rate.

## Logged cost of the completed local run

Usage window begins 2026-09-13 01:58 UTC. One pre-existing skill module was reused; nine were generated in this window. Figures include logged retries and exclude earlier sample renders and earlier multi-role testing. Application-cache hits cost no additional provider request.

| Component | Input tokens | Output tokens | USD | INR |
|---|---:|---:|---:|---:|
| Nine skill curricula, missions and first assessment sets | 8,920 | 66,170 | $1.019310 | ₹91.74 |
| Additional assignment sets, including retries (22 calls) | 26,030 | 54,577 | $0.896745 | ₹80.71 |
| One additional visual plan (another reused from cache) | 1,710 | 595 | $0.014055 | ₹1.26 |
| Logged text total | 36,660 | 121,342 | $1.930110 | ₹173.71 |

Claude Sonnet 4.6 pricing: $3/million input tokens and $15/million output tokens. Source: https://platform.claude.com/docs/en/about-claude/pricing . This is calculated from application logs, not a reconciled invoice; interrupted provider calls may not all have completed logging.

Thirteen narration requests produced the two new Indian English films. The speech integration saves audio, but not provider audio-token billing quantities, so exact voice spend is unknown. GPT-4o-mini-TTS is priced at $0.60/million input text tokens and $12/million output audio tokens: https://developers.openai.com/api/docs/models/gpt-4o-mini-tts . Final video duration is not an exact measure of billed speech because pauses, pacing and encoding can change it.

## Budget for another similar role

Allow approximately ₹180–₹220 for text content and assignment variants, based on extrapolating the nine-module run to ten modules and allowing some variation. Additional visual plans are approximately ₹1–₹2 per skill at the observed prompt size. Reserve ₹100 for narration initially, as a provisional allowance rather than a measured quote. A ₹400 one-time AI-content budget per 10-skill role leaves room for those items and retries; reconcile voice usage before treating this as a reliable unit cost. Human review and infrastructure are extra.

Original illustrations and MP4 encoding run locally through SVG/FFmpeg; there is no separate image-generation or generative-video API charge. Production compute still costs money. Replaying a finished lesson does not generate it again. YouTube search consumes the configured API quota; selecting and embedding a video does not call the narration or curriculum model.

## Per learner, recurring

Illustrative coaching request: 1,500 input tokens plus 400 output tokens costs $0.0105, or ₹0.945, using the current Sonnet model. Actual context and answer length vary; the configured maximum output is 1,800 tokens. One feedback request for each of 30 missions plus 12 reassessment answers would therefore be about ₹39.69 per learner under that assumption. Repeated revised answers add cost; reopening cached feedback does not.

At 500–1,000 learners each completing all 42 feedback requests, this example is ₹19,845–₹39,690 in AI coaching, plus hosting/bandwidth and any extra attempts. Learners who only watch videos or request fewer feedback rounds cost less. This is a scenario, not observed learner usage or a guaranteed monthly bill.

With a ₹400 content-creation allowance spread across 500–1,000 learners of the same role, the content share is ₹0.80–₹0.40 per learner. Ongoing coaching, human quality review and infrastructure determine the sustainable selling price more than initial content generation does.
