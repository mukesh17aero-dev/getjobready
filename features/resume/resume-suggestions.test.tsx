import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { SAMPLE_RESUME } from "./starter-resumes";
import { itemsOf, ResumeSuggestions } from "./resume-suggestions";
import { ResumeWorkbench } from "./resume-workbench";
import { DraftRequests, PickBox, requestsInstruction } from "./draft-requests";
import type { ResumeValidation } from "./resume-api";

const bench = (tool?: "content" | "draft" | "suggestions") => renderToStaticMarkup(
  <ResumeWorkbench resume={SAMPLE_RESUME} template="classic" role="" onChange={() => {}} onTemplate={() => {}} disabled={false} example={false} saveLabel="" saveFailed={false} onRetry={() => {}} templateChosen initialSection="interests"
    writer={{ getToken: async () => null, onAsk: async () => null }} {...(tool ? { tool } : {})} />,
);

describe("the editor's tools", () => {
  it("go Edit sections, Draft, Suggestions, ATS guide", () => {
    const tools = bench().match(/aria-label="Resume tools"[\s\S]*?<\/div>/)?.[0] ?? "";
    const labels = [...tools.matchAll(/<\/svg>([^<]+)<\/button>|>([^<>]+)<\/button>/g)].map(m => (m[1] ?? m[2]).trim());
    expect(labels).toEqual(["Edit sections", "Request changes", "Suggestions", "ATS guide"]);
  });

  it("lead from the last section to the draft", () => {
    expect(bench()).toContain(">Request changes →</button>");
  });

  it("move the footer from editing to the draft to suggestions to download", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio).toContain('? ["Done editing?", "Read it through and ask for any changes.", "Request changes"]');
    expect(studio).toContain('? ["Happy with it?", "See what would improve it before you download.", "Continue to suggestions"]');
    expect(studio).toContain('setTool(tool === "content" ? "draft" : "suggestions");');
  });
});

describe("the Draft tool", () => {
  it("tells the person to select words on the page, and lists what they asked", () => {
    // The hint over the page shows once they choose to edit.
    expect(readFileSync("features/resume/resume-workbench.tsx", "utf8")).toContain("{picking && !choosing && <p className={s.pickHint}>Select any words on the page to ask for a change.</p>}");
    const html = renderToStaticMarkup(<DraftRequests editing onEdit={() => {}} requests={[{ id: 1, quote: "Managed security", where: "Experience · entry 1", ask: "say I led it" }]} onAdd={() => {}} onRemove={() => {}} onRegenerate={() => {}} onUndo={() => {}} canUndo={false} reply="" busy={false} disabled={false} onContinue={() => {}} />);
    expect(html).toContain("Experience · entry 1");
    expect(html).toContain("say I led it");
    expect(html).toContain(">Regenerate resume · 1</button>");
    expect(html).toContain("Or ask in your own words");
    expect(html).toContain("SUGGESTED PROMPTS · TAP TO USE ONE");
    expect(html).not.toContain("Read it the way a recruiter will");
    expect(html).not.toContain("No changes asked for yet.");
    expect(html).not.toContain("Scribe");
  });

  it("goes straight on to suggestions when nothing is asked", () => {
    const html = renderToStaticMarkup(<DraftRequests editing onEdit={() => {}} requests={[]} onAdd={() => {}} onRemove={() => {}} onRegenerate={() => {}} onUndo={() => {}} canUndo={false} reply="" busy={false} disabled={false} onContinue={() => {}} />);
    expect(html).toContain(">Continue to suggestions →</button>");
    expect(html).not.toContain("Regenerate resume");
  });

  it("asks what should change about picked words", () => {
    const html = renderToStaticMarkup(<PickBox pick={{ quote: "Won best employee award", where: "Achievements", top: 10, left: 10 }} onAdd={() => {}} onClose={() => {}} />);
    expect(html).toContain("“Won best employee award”");
    expect(html).toContain("What should change?");
  });

  it("sends every request to the writer at once, each tied to its words", () => {
    const text = requestsInstruction([
      { id: 1, quote: "Coordinated sprint planning", where: "Experience · entry 1", ask: "say I led it" },
      { id: 2, quote: "", where: "Whole resume", ask: "keep it to one page" },
    ]);
    expect(text).toContain('(1) In Experience · entry 1, where it says "Coordinated sprint planning": say I led it');
    expect(text).toContain("(2) keep it to one page");
    expect(text).toContain("adding no fact I have not given you");
  });
});

describe("the Suggestions tool", () => {
  it("starts reading as soon as it opens, with a clear checking state", () => {
    const html = renderToStaticMarkup(<ResumeSuggestions active resume={SAMPLE_RESUME} template="classic" getToken={async () => null} onApply={() => {}} onUndo={() => {}} onOpenSection={() => {}} onAsk={async () => null} disabled={false} />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Checking your resume for suggestions…");
    expect(html).not.toContain("Check again");
    expect(html).not.toContain("Ask for any other change");
  });

  it("turns every finding into an item to tick, with a box where only the person knows the answer", () => {
    const report: ResumeValidation = {
      missing: [{ section: "A way to reach you", fix: "Add your email." }, { section: "Education", fix: "Add one qualification." }, { section: "Skills", fix: "Name three." }],
      ats: [{ label: "Dates on every entry", detail: "One entry has no dates." }],
      logic: [{ section: "achievements", where: "Achievements", detail: "That date has passed." }, { section: "header", where: "Contact details", detail: "Not a complete email address." }],
      corrections: [{ kind: "typo", section: "summary", before: "Recieved", after: "Received", why: "Spelling." }],
      stronger: [{ what: "No outcome on the dashboards line.", how: "Add what changed." }],
      fromRules: false,
    };
    const items = itemsOf(report, SAMPLE_RESUME);
    const kind = (title: string) => items.find(item => item.title.includes(title))?.how.kind;
    expect(kind("A way to reach you")).toBe("header");
    expect(kind("Skills")).toBe("skills");
    expect(kind("Education")).toBe("link");
    expect(kind("Achievements")).toBe("writer");
    expect(kind("Contact details")).toBe("header");
    expect(kind("Spelling")).toBe("exact");
    expect(kind("Dates on every entry")).toBe("writer");
    expect(kind("No outcome")).toBe("writer");
    expect(items.map(item => item.group)).toEqual(["must", "must", "must", "must", "must", "wording", "screening", "stronger"]);
  });

  it("applies the ticked ones in one go, and keeps what is ignored out of the way", () => {
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    expect(code).toContain("`Apply ${chosen.length} selected`");
    expect(code).toContain(">Ignore</button>");
    expect(code).toContain("Show\"} {ignored.size} ignored");
  });
});

describe("comments on the draft, Quip-style", () => {
  it("numbers each marker the same as its request, and each opens its request", async () => {
    const { CommentMarkers } = await import("./draft-requests");
    const html = renderToStaticMarkup(<CommentMarkers marks={[{ id: 7, n: 1, top: 120, left: 600 }, { id: 9, n: 2, top: 300, left: 600 }]} active={9} onActive={() => {}} />);
    expect(html).toContain('aria-label="Request 1: show it in the list"');
    expect(html).toMatch(/data-active="true"[^>]*>2<\/button>/);
    const list = renderToStaticMarkup(<DraftRequests editing onEdit={() => {}} requests={[{ id: 7, quote: "Managed security", where: "Experience · entry 1", ask: "say I led it" }]} onAdd={() => {}} onRemove={() => {}} onRegenerate={() => {}} onUndo={() => {}} canUndo={false} reply="" busy={false} disabled={false} onContinue={() => {}} active={7} onActive={() => {}} />);
    expect(list).toContain('id="draft-request-7"');
    expect(list).toMatch(/data-active="true"/);
  });

  it("keeps the words highlighted until the draft is regenerated, without touching the page's DOM", () => {
    const code = readFileSync("features/resume/draft-requests.tsx", "utf8");
    expect(code).toContain('api.highlights.set("draft-comment", new Highlight(...ranges));');
    expect(code).toContain('api.highlights.set("draft-pick"');
    const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
    expect(css).toContain(".paper ::highlight(draft-comment){");
    // A regeneration that changed the resume clears the list, and with it the highlights.
    expect(readFileSync("features/resume/resume-workbench.tsx", "utf8")).toContain("if (reply.changed) { edit(reply.resume); setRequests([]); }");
  });
});

describe("finding a comment's words on the page again", () => {
  it("finds words split across pieces, like a bold label and its colon", async () => {
    const { locateQuote } = await import("./draft-requests");
    // <strong>DevOps & Infrastructure</strong>":"" CI/CD pipelines, Jenkins"
    const pieces = ["DevOps & Infrastructure", ":", " ", "CI/CD pipelines, Jenkins"];
    expect(locateQuote(pieces, "DevOps & Infrastructure: CI/CD pipelines")).toEqual({ start: [0, 0], end: [3, 15] });
  });

  it("finds words across two lines, whatever whitespace the selection carried", async () => {
    const { locateQuote } = await import("./draft-requests");
    const pieces = ["Managed security and compliance.", "Led sprint planning for 15 members."];
    expect(locateQuote(pieces, "compliance.\n\nLed sprint")).toEqual({ start: [0, 21], end: [1, 10] });
  });

  it("finds the second comment as well as the first", async () => {
    const { locateQuote } = await import("./draft-requests");
    const pieces = ["Summary", "System Development Engineer II at Amazon", "Skills", "Python, Bash"];
    expect(locateQuote(pieces, "Engineer II")).not.toBeNull();
    expect(locateQuote(pieces, "Python, Bash")).toEqual({ start: [3, 0], end: [3, 12] });
    expect(locateQuote(pieces, "not on the page")).toBeNull();
  });
});

describe("suggestion groups", () => {
  it("start collapsed, open from their heading, and carry no count", () => {
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    // Collapsed, except in the signed-out example, where everything is open to read.
    expect(code).toContain("<details key={group} className={s.group} open={Boolean(sample) || undefined}>");
    expect(code).toContain("<summary><h3>{title}</h3>");
    expect(code).not.toContain("{title} <span>{items.length}</span>");
  });
});

describe("the walk-through of every way to change a draft", () => {
  it("asks first whether they want to edit the draft, or move on to suggestions", () => {
    const html = bench("draft");
    expect(html).toContain(">Do you want to request changes?</p>");
    expect(html).toContain(">Yes, request changes</button>");
    expect(html).toContain(">Continue to suggestions →</button>");
    // Nothing to edit with, and nothing to pick on the page, until they say yes.
    expect(html).not.toContain("SUGGESTED PROMPTS");
    expect(html).not.toContain("Select any words on the page to ask for a change.");
  });

  it("shows how to edit, the prompts and the box to ask in, once they say yes", () => {
    const html = renderToStaticMarkup(<DraftRequests editing onEdit={() => {}} requests={[]} onAdd={() => {}} onRemove={() => {}} onRegenerate={() => {}} onUndo={() => {}} canUndo={false} reply="" busy={false} disabled={false} onContinue={() => {}} onShowMe={() => {}} />);
    expect(html).toMatch(/Show me how to edit<\/button>[\s\S]*?aria-label="How to request changes"/);
    expect(html).toContain("SUGGESTED PROMPTS · TAP TO USE ONE");
    expect(html).toContain("Or ask in your own words");
    expect(html).not.toContain("Do you want to request changes?");
    expect(readFileSync("features/resume/resume-workbench.module.css", "utf8")).toContain(".pickHint{user-select:none;-webkit-user-select:none}");
  });

  it("only counts words picked on the resume page itself", () => {
    const code = readFileSync("features/resume/draft-requests.tsx", "utf8");
    expect(code).toContain('!start.closest("#resume-sheet") || !end?.closest("#resume-sheet")');
  });

  it("explains every step of changing the draft in the side panel", () => {
    const code = readFileSync("features/resume/draft-requests.tsx", "utf8");
    for (const step of ["Select words on your resume.", "Tap a suggested prompt.", "Type anything.", "Check your list.", "Press Regenerate resume.", "Continue to suggestions"]) expect(code).toContain(step);
  });

  it("shows all four ways, in order, on the real controls", () => {
    const code = readFileSync("features/resume/draft-demo.tsx", "utf8");
    const steps = ["Select words on your resume and say what should change", "Or tap a suggested prompt", "Or type anything you want changed", "Then regenerate your resume from your list"];
    let at = 0;
    for (const step of steps) { const next = code.indexOf(step, at); expect(next).toBeGreaterThan(-1); at = next; }
    for (const target of ["prompt", "ask", "add", "regenerate"]) expect(code).toContain(`panel("${target}")`);
    const panel = readFileSync("features/resume/draft-requests.tsx", "utf8");
    for (const target of ['data-glimpse={i === 0 ? "prompt" : undefined}', 'data-glimpse="ask"', 'data-glimpse="add"', 'data-glimpse="regenerate"', 'data-glimpse="add-pick"']) expect(panel).toContain(target);
  });

  it("marks its requests as examples, never sends them, and takes them away when it ends", () => {
    const list = renderToStaticMarkup(<DraftRequests editing onEdit={() => {}} requests={[{ id: 1, quote: "", where: "Whole resume", ask: "Put my internship first", demo: true }]} onAdd={() => {}} onRemove={() => {}} onRegenerate={() => {}} onUndo={() => {}} canUndo={false} reply="" busy={false} disabled={false} onContinue={() => {}} />);
    expect(list).toContain(">Example</span>");
    expect(list).not.toContain("Remove request 1");
    const bench = readFileSync("features/resume/resume-workbench.tsx", "utf8");
    expect(bench).toContain("requestsInstruction(requests.filter(item => !item.demo))");
    expect(bench).toContain("onEnd: () => setRequests(list => list.filter(item => !item.demo))");
    expect(bench).toContain("onShowMe={demo.start}");
    expect(bench).not.toContain("demoSeen()");
  });
});


describe("answering one suggestion", () => {
  it("applies just that one from its own button, once any answer it needs is typed", () => {
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    expect(code).toContain('onApplyOne={() => void apply([item])}');
    expect(code).toContain('{how.kind === "exact" ? "Apply this fix" : "Add to resume"}');
    expect(code).toContain("disabled={disabled || waiting}");
    // Enter in the box applies it too.
    // Enter in the box does the same as the button: preview a rewrite, add a typed detail.
    expect(code).toContain('if (event.key === "Enter" && !waiting) { event.preventDefault(); if (how.kind === "writer") onPreview(); else onApplyOne(); }');
  });

  it("asks a short question, with the example inside the box", () => {
    const report: ResumeValidation = { missing: [], ats: [], logic: [{ section: "achievements", where: "Achievements", detail: "That date has passed." }], corrections: [], stronger: [], fromRules: false };
    const [item] = itemsOf(report, SAMPLE_RESUME);
    // A date problem needs them to say what is true: required, not optional.
    expect(item!.how).toMatchObject({ kind: "writer", label: "What is true?", hint: "For example: it happened in March 2026, or take it out", needed: true });
  });
});

describe("which suggestions carry a checkbox", () => {
  it("only those that can be applied as they stand", async () => {
    const { tickable } = await import("./resume-suggestions");
    const report: ResumeValidation = {
      missing: [{ section: "A way to reach you", fix: "Add your email." }, { section: "Education", fix: "Add one." }, { section: "Your profile", fix: "Add a summary." }],
      ats: [{ label: "Dates on every entry", detail: "One has none." }],
      logic: [],
      corrections: [{ kind: "typo", section: "summary", before: "Recieved", after: "Received", why: "Spelling." }],
      stronger: [],
      fromRules: false,
    };
    const ticks = Object.fromEntries(itemsOf(report, SAMPLE_RESUME).map(item => [item.title, tickable(item.how)]));
    // Only a change shown in full can be ticked; a rewrite is previewed first.
    expect(ticks).toMatchObject({ "A way to reach you": false, Education: false, "Your profile": false, "Dates on every entry": false });
    expect(Object.entries(ticks).find(([title]) => title.startsWith("Spelling"))?.[1]).toBe(true);
  });
});

describe("after the suggestions", () => {
  it("leads on to Download, with the AI Recruiter Review after it", () => {
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    expect(code).toContain(">Continue to download →</button>");
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    // Your details, Draft, Download, then the optional review.
    const order = ["{ id: \"start\"", "{ id: \"draft\"", "{ id: \"export\", name: \"Download\" }", "{ id: \"review\", name: \"AI Recruiter Review\" }"].map(item => studio.indexOf(item));
    expect(order.every((at, i) => at > -1 && (i === 0 || at > order[i - 1]!))).toBe(true);
    expect(studio).toContain('if (stage === "draft") return openStage("export");');
    expect(studio).toContain('if (exported) return go("review");');
    expect(studio).toContain('["Downloaded.", "See how a recruiter would read it - optional.", "AI Recruiter Review"]');
    expect(studio).not.toMatch(/"Recruiter Review"/);
  });
});


describe("the order of the Draft panel", () => {
  it("puts the requested edits under the box they come from, and the buttons under them", () => {
    const html = renderToStaticMarkup(<DraftRequests editing onEdit={() => {}} requests={[{ id: 1, quote: "", where: "Whole resume", ask: "keep it to one page" }]} onAdd={() => {}} onRemove={() => {}} onRegenerate={() => {}} onUndo={() => {}} canUndo={false} reply="" busy={false} disabled={false} onContinue={() => {}} />);
    const at = (text: string) => html.indexOf(text);
    expect(at("Or ask in your own words")).toBeGreaterThan(-1);
    expect(at("Your requested edits")).toBeGreaterThan(at("Or ask in your own words"));
    expect(at("keep it to one page")).toBeGreaterThan(at("Your requested edits"));
    expect(at("Regenerate resume · 1")).toBeGreaterThan(at("keep it to one page"));
    expect(at("Skip to suggestions")).toBeGreaterThan(at("Regenerate resume · 1"));
  });
});

it("pins Apply to the panel's real bottom edge, so nothing scrolls underneath it", () => {
  const css = readFileSync("features/resume/resume-suggestions.module.css", "utf8");
  expect(css).toContain(".applyBar{position:sticky;bottom:calc(-1 * var(--controls-pad-bottom,0px));");
  expect(readFileSync("features/resume/resume-workbench.module.css", "utf8")).toContain(".workbench .controls{--controls-pad-bottom:24px}");
});

describe("nothing goes into the resume until it is seen and accepted", () => {
  it("names every line a rewrite would change, with what it says now and what it would say", async () => {
    const { resumeChanges } = await import("./resume-suggestions");
    const before = { ...SAMPLE_RESUME, achievements: ["Promotion expected in March 2026", "Won the award"] };
    const after = { ...before, achievements: ["Won the award"] };
    expect(resumeChanges(before, after)).toEqual([
      { where: "Achievements · line 1", before: "Promotion expected in March 2026", after: "Won the award" },
      { where: "Achievements · line 2", before: "Won the award", after: "" },
    ]);
    expect(resumeChanges(before, before)).toEqual([]);
  });

  it("previews a rewrite, and only Accept puts it in - on the version it was written for", () => {
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    expect(code).toContain('"Preview the change"');
    expect(code).toContain(">Accept</button>");
    expect(code).toContain(">Discard</button>");
    expect(code).toContain("if (proposal.base !== resume)");
    // The batch button only applies changes already shown in full.
    const apply = code.slice(code.indexOf("async function apply(selection"), code.indexOf("return (\n    <section"));
    expect(apply).not.toContain("onAsk(");
    expect(code).toContain("Nothing changes until you have seen the exact change and accepted it.");
  });
});

describe("asking for a fact only when the change needs one", () => {
  it("requires an answer before a preview for stronger lines, gone-by forecasts and checks that ask; not for a rewording", () => {
    const report: ResumeValidation = {
      missing: [],
      ats: [{ label: "Dates on every entry", detail: "One has none.", ask: "When did the store job run?" }, { label: "Skills a screener can match", detail: "Too many." }],
      logic: [{ section: "achievements", where: "Achievements", detail: "That date has passed.", needsFact: true }, { section: "achievements", where: "Achievements", detail: "Not happened yet.", needsFact: false }],
      corrections: [],
      stronger: [{ what: "No figure on the revenue line.", how: "Add the amount and the period." }],
      fromRules: false,
    };
    const needed = Object.fromEntries(itemsOf(report, SAMPLE_RESUME).map(item => [item.detail, item.how.kind === "writer" && item.how.needed]));
    expect(needed).toEqual({ "One has none.": true, "Too many.": false, "That date has passed.": true, "Not happened yet.": false, "Add the amount and the period.": true });
    const dates = itemsOf(report, SAMPLE_RESUME).find(item => item.title === "Dates on every entry")!;
    expect(dates.how).toMatchObject({ label: "When did the store job run?" });
    // A required box is never labelled optional, and its preview waits for an answer.
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    expect(code).toContain('{how.label}{how.kind === "writer" && !how.needed ? <em className={s.optional}> (optional)</em> : " *"}');
    expect(code).toContain('(how.kind === "writer" && how.needed)) && !answer.trim()');
  });
});

it("names the step and its tools without saying Draft twice", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).toContain('{ id: "draft", name: "Edit resume" }');
  const tools = bench().match(/aria-label="Resume tools"[\s\S]*?<\/div>/)?.[0] ?? "";
  expect(tools).not.toMatch(/>Draft</);
  expect(tools).not.toContain("Edit content");
});

describe("Suggestions read the finished resume once", () => {
  it("does not read again after a fix applied here, and ticks that item off", () => {
    const code = readFileSync("features/resume/resume-suggestions.tsx", "utf8");
    // A version made here is known, so it is not stale; a change made elsewhere is.
    expect(code).toContain("const stale = !read || (read.for !== resume && !read.known.includes(resume));");
    expect(code).toContain("setRead(r => r ? { ...r, known: [...r.known, next], done: [...r.done, ...keys] } : r);");
    expect(code).toContain("!(read?.done.includes(item.key))");
    // Every way of applying goes through it.
    expect(code).toContain("own(proposal.revised, [item.key]);");
    expect(code).toContain("if (next !== resume) own(next, applied);");
  });

});
