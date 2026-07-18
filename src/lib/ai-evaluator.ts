// AI grades the artifact and produces feedback ONLY — it never sets a
// readiness status. See docs/BUILD_GUIDE.md section 2.5. Any failure
// here (network, auth, rate limit, malformed JSON) returns null and
// never throws, so a broken AI call can never block evidence creation
// or status recalculation in /api/assessments.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const PROMPT_VERSION = "PV-1.0";

// Model IDs are taken verbatim from docs/BUILD_GUIDE.md section 2.5.
const HAIKU_MODEL = "claude-haiku-4-5";
const SONNET_MODEL = "claude-sonnet-4-6";

const SONNET_ASSESSMENT_TYPES = new Set(["mock_interview", "simulation"]);

function modelFor(assessmentType: string): string {
  return SONNET_ASSESSMENT_TYPES.has(assessmentType) ? SONNET_MODEL : HAIKU_MODEL;
}

const AiEvaluationSchema = z.object({
  raw_score: z.number(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  student_summary: z.string(),
  improvement_action: z.string(),
});

export type AiEvaluationResult = z.infer<typeof AiEvaluationSchema>;

const SYSTEM_PROMPT = `You are an assessment evaluator for GetJobReady.ai, an employability platform for frontline job seekers in India. Grade the student's submission and respond with ONLY a JSON object (no markdown, no code fences, no extra text) matching exactly this shape:
{"raw_score": number 0-100, "strengths": string[], "gaps": string[], "student_summary": string, "improvement_action": string}`;

const STRICT_RETRY_SUFFIX =
  "\n\nYour previous response could not be parsed as JSON. Respond with ONLY the raw JSON object — no markdown, no code fences, no explanation.";

function parseResponse(text: string): AiEvaluationResult | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const result = AiEvaluationSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function extractText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

export async function evaluateAssessment(input: {
  assessmentType: string;
  submissionPayload: unknown;
}): Promise<AiEvaluationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new Anthropic({ apiKey });
  const model = modelFor(input.assessmentType);
  const userPrompt = `Assessment type: ${input.assessmentType}\nSubmission:\n${JSON.stringify(
    input.submissionPayload,
    null,
    2
  )}`;

  try {
    const first = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const firstResult = parseResponse(extractText(first));
    if (firstResult) {
      return firstResult;
    }

    const retry = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt + STRICT_RETRY_SUFFIX }],
    });
    return parseResponse(extractText(retry));
  } catch {
    return null;
  }
}
