import type { ArcScene, InteractionResponse, SceneInteraction } from "@/lib/api";

// Form completeness and readable serialization only. Evaluation stays on the server.
export function emptyInteraction(interaction?: SceneInteraction): InteractionResponse | null {
  if (!interaction) return null;
  if (interaction.kind === "routing") return { kind: "routing", choiceId: "", message: "" };
  if (interaction.kind === "prioritisation") return { kind: "prioritisation", orderedIds: interaction.items.map(item => item.id), reason: "" };
  return { kind: "handover", values: {} };
}
export function interactionComplete(config: SceneInteraction, answer: InteractionResponse | null): boolean {
  if (!answer || config.kind !== answer.kind) return false;
  if (config.kind === "routing" && answer.kind === "routing") return config.choices.some(c => c.id === answer.choiceId) && Boolean(answer.message.trim());
  if (config.kind === "prioritisation" && answer.kind === "prioritisation") return answer.orderedIds.length === config.items.length && new Set(answer.orderedIds).size === config.items.length && config.items.every(item => answer.orderedIds.includes(item.id)) && Boolean(answer.reason.trim());
  if (config.kind === "handover" && answer.kind === "handover") return config.fields.every(field => field.required === false || Boolean(answer.values[field.id]?.trim()));
  return false;
}
export function interactionText(config: SceneInteraction, answer: InteractionResponse | null): string {
  if (!answer) return "";
  if (config.kind === "routing" && answer.kind === "routing") return `${config.choices.find(c => c.id === answer.choiceId)?.label ?? "No action selected"}: ${answer.message}`;
  if (config.kind === "prioritisation" && answer.kind === "prioritisation") return answer.orderedIds.map((id, index) => `${index + 1}. ${config.items.find(item => item.id === id)?.label ?? id}`).join("\n") + `\nReason: ${answer.reason}`;
  if (config.kind === "handover" && answer.kind === "handover") return config.fields.map(field => `${field.label}: ${answer.values[field.id] ?? ""}`).join("\n");
  return "";
}

/** Reading layout only. Original text stays intact; no facts or answer criteria are inferred. */
export function assessmentQuestionCards(brief: string): { question: string; cards: Array<{ title: string; body: string }> } {
  const sections = brief.trim().split(/\n(?=###\s+)/);
  if (sections.length > 1) return {
    question: sections[0].trim(),
    cards: sections.slice(1).map(section => {
      const [heading, ...body] = section.split("\n");
      return { title: heading.replace(/^###\s+/, "").trim(), body: body.join("\n").trim() };
    }),
  };
  return { question: "What would you do in this situation?", cards: brief.trim() ? [{ title: "The situation and your task", body: brief.trim() }] : [] };
}

/** Convert authoring layout without discarding a single existing paragraph. */
export function formatAssessmentQuestion(brief: string, answer = "typed"): string {
  // Remove only explicit availability notices. Scenario dialogue, policy facts
  // and supplied AI drafts remain unchanged.
  let clean = reviseLegacyAssessmentText(brief)
    .replace(/\bYou can ask [A-Z][a-z]+ for help\.\s*/g, "")
    .replace(/\b(?:The|Your) (?:AI )?assistant is (?:also )?(?:available(?: on your screen| if you want to use it| if you want it| if you want to think through the wording)?|open(?: on your screen)?|on(?: your screen)?)\.\s*/g, "")
    .replace(/\bYou (?:also )?have (?:the|your) AI assistant(?: (?:available(?: on your screen| if you want to use it)?|open on the side screen))?\.\s*/g, "")
    .replace(/\bYou (?:also )?have (?:the|your|an) AI assistant (?:open|available)(?: on (?:your (?:screen|tablet)|the (?:side panel|hub laptop)))?\.\s*/g, "")
    .replace(/\bThe AI assistant is still open\.\s*/g, "")
    .replace(/\bYou can ask him one question\.\s*/g, "")
    .replace(/ and you can ask him\./g, ".")
    .replace(/\byour buddy\b/gi, "your teammate")
    .trim();
  // Exact legacy notices: keep the task and its checks, remove promises of a
  // live helper. References to a supplied AI draft are assessment material.
  const notices: Array<[string, string]> = [
    ["You have the AI assistant open if you want to use it, but the log itself is what matters here.", "The log itself is what matters here."],
    ["You must write it yourself; you may use the AI assistant to check your draft, but the facts and the recommendation must come from the data above.", "Write it yourself; the facts and recommendation must come from the data above."],
    ["She says you can use the AI assistant to draft it.", ""],
    ["Use the AI assistant if it helps you draft or structure, but the proposal must reflect what you know about how Meditrust actually works.", "The proposal must reflect what you know about how Meditrust actually works."],
    ["You are alone at the desk with the AI assistant available.", "You are alone at the desk."],
    ["The AI assistant can help you draft the reply email.", ""],
    [" and the AI assistant is available.", "."],
    [", and the AI assistant is available.", "."],
    [", and the AI assistant is also available.", "."],
    [", and the AI assistant is open on your screen.", "."],
    [" and the AI assistant is open.", "."],
    ["You have an AI assistant available on your screen.", ""],
    ["You have the AI assistant open.", ""],
    ["You have the AI assistant open on your screen.", ""],
    ["The AI assistant is available to help you prepare, but the spoken answer is yours.", "The spoken answer is yours."],
    ["There is no AI tool needed for this one, but the assistant is available if you want it.", ""],
    [" (you can use the AI assistant to help you think through the reason)", ""],
    ["Use the AI assistant if you want help with wording, but check it before you submit — last week", "Check the wording before you submit — last week"],
    ["You can use the AI assistant to help you think, but read the numbers yourself first before you do.", "Read the numbers yourself before answering."],
    ["You can use the AI assistant to help you draft the note, but check any numbers it uses against the table above before you hand it over.", "Check the numbers in your note against the table above before you hand it over."],
    ["You can use the AI assistant to help you redraft — but you are responsible for what goes out.", "You are responsible for what goes out."],
    ["Use the AI assistant if you want help with wording, but check what it writes before you send it.", "Check your wording before you send it."],
    ["Use the AI assistant to help structure it if you want, but every number and status", "Every number and status"],
    ["Priya and your AI assistant are both available.", "Priya is your teammate."],
    ["No buddy help for this one — Arjun specifically wants your unassisted read.", "Arjun wants your own reading of the situation."],
    ["Your task: there is no buddy to ask.", "Your task: decide independently."],
    ["You have the AI assistant available but the judgement about which accounts matter and what to do is yours.", "The judgement about which accounts matter and what to do is yours."],
  ];
  for (const [notice, replacement] of notices) clean = clean.replaceAll(notice, replacement);
  clean = clean.replace(/,\./g, ".").trim();
  if (/\n###\s+/.test(clean)) return clean;
  const paragraphs = clean.split(/\n\s*\n/).filter(Boolean);
  // Group short related paragraphs, rather than making every line its own card.
  const cards: string[] = [];
  for (const paragraph of paragraphs) {
    const sentences = paragraph.length > 650 ? paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/u) : [paragraph];
    for (const part of sentences) {
      const last = cards.length - 1;
      if (last >= 0 && cards[last].length + part.length + 2 <= 550) cards[last] += "\n\n" + part;
      else cards.push(part);
    }
  }
  const question = answer === "spoken" ? "What would you say in this situation?" : answer === "artefact" ? "What would you write or record for this task?" : "What would you do in this situation?";
  return question + "\n\n" + cards.map((text, i) => `### ${i === 0 ? "Situation" : `Context ${i + 1}`}\n${text}`).join("\n\n");
}

// Matching authoring edits for legacy tasks that required a live helper or
// pasted answer. These are draft content edits, never runtime scoring rules.
function reviseLegacyAssessmentText(text: string): string {
  const replacements: Array<[string, string]> = [
    ["Type a prompt that gets the assistant to help you write a short internal alert to the operations team about Nagpur. Then paste the draft the assistant gives you and mark any part you would change before sending it — explain why in one line.", "Write a short internal alert to the operations team about Nagpur. Include the relevant numbers and customer calls, distinguish what is confirmed from what needs checking, and explain your next step in one line."],
    ["Writes a prompt that gives the assistant city name, the numbers, and the context of customer calls", "Writes an alert with the city name, relevant numbers, and customer-call context"],
    ["Reviews the draft critically and flags anything vague, inaccurate, or missing before sending", "Distinguishes confirmed facts from possible explanations and names what needs checking"],
    ["After flagging what to change, rewrite the alert yourself from scratch and explain what the AI draft missed.", "Write the alert yourself and explain one risk that the dashboard alone does not confirm."],
    ["Use the AI assistant to draft a short note for the Notes field that explains the hold clearly enough that any dispatcher reading it would not send the batch. Then check the draft before you paste it in, and type what you would actually enter in each field — including any changes you made to the AI draft and why.", "Type what you would enter in each tracker field and write a short Notes entry explaining the hold. Check it against the quality email and explain why dispatch must wait."],
    ["Checks the AI draft before accepting it — does not paste without reading", "Checks the note against the quality email before recording the hold"],
    ["If the AI draft says anything vague (e.g. 'pending further review') the candidate tightens it to name the batch and say re-inspection is required before dispatch", "Names the batch and states that re-inspection is required before dispatch, avoiding a vague hold reason"],
    ["use the AI assistant to draft the finance message, then check it and paste your final version.", "write the finance message yourself and check its facts before submitting."],
    ["Checks the AI draft — if it says something like 'please action at your earliest convenience' candidate replaces it with a specific deadline", "Gives finance a specific deadline instead of a vague request to action at their earliest convenience"],
    ["paste the corrected version as your answer", "type the corrected version as your answer"],
    ["Paste your corrected email here.", "Type your corrected email here."],
    ["Uses the AI assistant to help with drafting but applies their own judgement to the interpretation", "Applies their own judgement to interpreting the figures and checks the report against the supplied data"],
    ["After writing your note, use the AI assistant to draft two questions you could ask the team lead to clarify the discrepancy. Then check the draft and mark any part you would change before sending it.", "After writing your note, write two questions you would ask the team lead to clarify the discrepancy and explain why each question matters."],
    ["After writing the summary, use the AI assistant to draft a short opening line for one of the at-risk calls, then identify one thing in the draft you would change before using it.", "After writing the summary, write a short opening line for one of the at-risk calls and explain which facts you would check before the call."],
    ["The product fact sheet is not given — the student must ask Arjun or the assistant what the correct premium and underwriting rules are before rewriting.", "Include a conflicting product fact sheet; ask the student to identify what needs confirmation before quoting a premium or underwriting rule."],
    ["The rate card is not quoted in the brief — the student must ask Arjun or the assistant for the correct premium before they can fix step 4.", "Include a second rate card with a conflicting premium; ask the student to explain what must be verified before fixing step 4."],
    ["Remove the policy sheet — they must ask the assistant or Priya what the policy is before they can complete the record.", "Keep the policy sheet and add a conflicting ticket note; ask the student to explain what must be verified before completing the record."],
  ];
  for (const [before, after] of replacements) text = text.replaceAll(before, after);
  return text;
}

export function formatAssessmentScene(scene: ArcScene): ArcScene {
  return { ...scene, brief: formatAssessmentQuestion(scene.brief, scene.answer), support: "assistant",
    fields: scene.fields.map(reviseLegacyAssessmentText), measures: scene.measures.map(reviseLegacyAssessmentText),
    ...(scene.criteria ? { criteria: scene.criteria.map(reviseLegacyAssessmentText) } : {}),
    ...(scene.easier ? { easier: reviseLegacyAssessmentText(scene.easier) } : {}),
    ...(scene.harder ? { harder: reviseLegacyAssessmentText(scene.harder) } : {}),
  };
}
