import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateAssessment } from "./ai-evaluator";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

beforeEach(() => {
  mockCreate.mockReset();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("evaluateAssessment", () => {
  it("parses a valid JSON response on the first attempt", async () => {
    const expected = {
      raw_score: 78,
      strengths: ["Clear structure"],
      gaps: ["Missing greeting"],
      student_summary: "Good effort overall.",
      improvement_action: "Add a proper greeting line.",
    };
    mockCreate.mockResolvedValueOnce(textResponse(JSON.stringify(expected)));

    const result = await evaluateAssessment({
      assessmentType: "written_task",
      submissionPayload: { text: "Dear team, ..." },
    });

    expect(result).toEqual(expected);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("retries once on malformed JSON, then returns null if still invalid", async () => {
    mockCreate
      .mockResolvedValueOnce(textResponse("this is not json"))
      .mockResolvedValueOnce(textResponse("still not json"));

    const result = await evaluateAssessment({
      assessmentType: "quiz",
      submissionPayload: { answers: [] },
    });

    expect(result).toBeNull();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("returns null without throwing when the API call errors", async () => {
    mockCreate.mockRejectedValueOnce(new Error("rate limit exceeded"));

    await expect(
      evaluateAssessment({
        assessmentType: "mock_interview",
        submissionPayload: { transcript: "..." },
      })
    ).resolves.toBeNull();
  });
});
