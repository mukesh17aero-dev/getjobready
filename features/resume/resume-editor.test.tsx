import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SAMPLE_RESUME } from "./starter-resumes";
import { ResumeSectionEditor, reorderEntry, RESUME_SECTIONS } from "./resume-section-editor";
import { resumeDraftIssue } from "./resume-draft-validation";
import { ResumeWorkbench } from "./resume-workbench";
import { ResumeStudio } from "./resume-studio";
import { ResumeAtsGuide } from "./resume-ats-guide";
import { ResumeSheet, type SheetFocus } from "./resume-sheet";
import { TEMPLATES } from "./templates";
import type { ResumeTemplate } from "./resume-api";

describe("direct resume editing", () => {
  it("flags the two-column layout and offers a simpler alternative without claiming certification", () => {
    const props = { disabled: false, onTemplate: () => {}, onSection: () => {} };
    const sidebar = renderToStaticMarkup(createElement(ResumeAtsGuide, { ...props, template: "sidebar" }));
    expect(sidebar).toContain("Use Basic single-column layout");
    expect(sidebar).toContain("two columns");
    expect(sidebar).toContain("no template guarantees acceptance");
    const basic = renderToStaticMarkup(createElement(ResumeAtsGuide, { ...props, template: "classic" }));
    expect(basic).not.toContain("Use Basic single-column layout");
    expect(basic).toContain("selected layout uses one column");
  });
  it("guides first-job applicants and career changers without inventing achievements", () => {
    const html = renderToStaticMarkup(createElement(ResumeAtsGuide, { template: "classic", disabled: false, onTemplate: () => {}, onSection: () => {} }));
    for (const text of ["First job?", "Changing careers?", "Experienced?", "only when you can verify", "plain-text editor", "employer’s requested file type"]) expect(html).toContain(text);
  });
  it("makes every supported section directly editable", () => {
    for (const [section, label] of RESUME_SECTIONS) {
      const html = renderToStaticMarkup(createElement(ResumeSectionEditor, {section, resume:{...SAMPLE_RESUME,projects:[{title:"Project",detail:"Contribution",tools:[]}],certifications:[{title:"Certificate",issuer:"Issuer",year:"2026"}]}, onChange:()=>{}, disabled:false}));
      expect(html).toContain(label);
      expect(html).toMatch(/<(input|textarea)/);
      expect(html).not.toContain('<fieldset disabled=""');
    }
  });
  it("locks example content and while a rewrite is in flight", () => {
    const html = renderToStaticMarkup(createElement(ResumeSectionEditor, {section:"header",resume:SAMPLE_RESUME,onChange:()=>{},disabled:true}));
    expect(html).toContain('<fieldset disabled=""');
  });
  it("reorders entries without mutating the original and protects both boundaries", () => {
    const entries = [{title:"First"},{title:"Second"},{title:"Third"}];
    expect(reorderEntry(entries,1,-1).map(item=>item.title)).toEqual(["Second","First","Third"]);
    expect(reorderEntry(entries,1,1).map(item=>item.title)).toEqual(["First","Third","Second"]);
    expect(entries[0].title).toBe("First");
    expect(reorderEntry(entries,0,-1)).toBe(entries);
    expect(reorderEntry(entries,2,1)).toBe(entries);
  });
  it("refuses content the save API would otherwise silently truncate", () => {
    expect(resumeDraftIssue({...SAMPLE_RESUME,summary:"x".repeat(701)})).toContain("700 characters");
    expect(resumeDraftIssue({...SAMPLE_RESUME,experience:[{title:"Support",organisation:"",period:"",bullets:Array(6).fill("A real contribution") }]})).toContain("5 entries");
    expect(resumeDraftIssue({...SAMPLE_RESUME,header:{...SAMPLE_RESUME.header,name:""}})).toContain("Add your full name");
    expect(resumeDraftIssue({...SAMPLE_RESUME,summary:"x".repeat(700)})).toBeNull();
  });
  it("opens the saved display template independently of the Word structure", () => {
    const html = renderToStaticMarkup(createElement(ResumeStudio,{target:null,recordAt:"2026-10-03",profile:{version:1,createdAt:"2026-10-03",education:[],experience:[],projects:[],achievements:[],preferences:{resumeLedger:[{at:"2026-10-03",role:"Support",template:"classic",displayTemplate:"professional",resume:SAMPLE_RESUME}]}}}));
    expect(html).toContain('aria-label="Resume editing workspace"');
    // The page is drawn in the saved Professional look: its dark heading bars.
    expect(html).toContain("bg-[#111827] px-2 py-0.5");
    expect(html).toContain('aria-label="Undo edit"');
    // A saved draft says nothing; only saving and failing to save do.
    expect(html).not.toContain("All changes saved to your account");
    expect(html).not.toContain("Required details complete");
  });
  it("labels required contact fields without making optional contact details mandatory", () => {
    const html = renderToStaticMarkup(createElement(ResumeSectionEditor, {section:"header",resume:SAMPLE_RESUME,onChange:()=>{},disabled:false}));
    expect(html.match(/aria-required="true"/g)).toHaveLength(2);
    // A red asterisk marks what is needed; optional fields carry no mark.
    expect(html).not.toContain("Required to download");
    expect(html).not.toMatch(/>(Optional|Required)</);
    // Section title plus its two required fields, each told to a screen reader as "required".
    expect(html.match(/ \(required\)/g)).toHaveLength(3);
  });
  it("opens the first required entry without an extra Add click", () => {
    for (const section of ["experience","education","skills"] as const) {
      const html = renderToStaticMarkup(createElement(ResumeSectionEditor,{section,resume:{...SAMPLE_RESUME,experience:[],education:[],skills:[]},onChange:()=>{},disabled:false}));
      expect(html).toContain('aria-required="true"');
      expect(html).toMatch(/<input/);
    }
  });
  it("offers a direct route to every missing export requirement", () => {
    // Started (a name typed), with every other required detail still missing.
    const resume={...SAMPLE_RESUME,header:{name:"A. Sample",email:"",city:""},summary:"",experience:[],education:[],skills:[]};
    const html=renderToStaticMarkup(createElement(ResumeWorkbench,{resume,template:"classic",role:"",onChange:()=>{},onTemplate:()=>{},disabled:false,example:false,saveLabel:"Saving",saveFailed:false,onRetry:()=>{},onDownload:()=>{}}));
    // The route is the section buttons: every required section that is still
    // empty carries the "needed" mark; the old box above the editor is gone.
    for (const label of ["Contact details","Summary","Experience","Education","Skills"]) {
      expect(html).toMatch(new RegExp(`data-state="needed"[^>]*>(<svg[\\s\\S]*?<\\/svg>)?${label}`));
    }
    expect(html).not.toContain("Before you download, add:");
    expect(html).not.toContain("Required fields are labelled");
  });

});

it("has no second download button in the builder with steps, but keeps it for the signed-out editor", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).not.toContain('onDownload={() => go("export")}');
  expect(readFileSync("features/resume/guest-resume.tsx", "utf8")).toContain("onDownload={download}");
  const html = renderToStaticMarkup(createElement(ResumeWorkbench, { resume: SAMPLE_RESUME, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {} }));
  expect(html).not.toContain("Download ↓");
});

describe("content before layout selection", () => {
  const bench = (templateChosen: boolean) =>
    renderToStaticMarkup(createElement(ResumeWorkbench, { resume: SAMPLE_RESUME, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {}, templateChosen }));

  it("has no Templates tab and no Preview button; Select template takes their place", () => {
    const html = bench(true);
    expect(html).not.toMatch(/>Templates<\/button>/);
    expect(html).not.toMatch(/>(Preview|Back to editing)<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*aria-controls="resume-layouts"[^>]*><svg[\s\S]*?<\/svg>Select template<\/button>/);
  });

  it("opens the layout gallery for a new resume, keeping the sheet in the page", () => {
    const html = bench(false);
    expect(html).toContain('data-choosing="true"');
    expect(html).toContain('aria-label="Resume layout"');
    expect(html).toContain('id="resume-sheet"');
    expect(html).toMatch(/aria-pressed="true"[^>]*aria-controls="resume-layouts"[^>]*><svg[\s\S]*?<\/svg>Select template</);
  });

  it("shows the resume, not the layouts, once a layout is picked", () => {
    const html = bench(true);
    expect(html).toContain('data-choosing="false"');
    expect(html).not.toContain('aria-label="Resume layout"');
    expect(html).toContain('id="resume-sheet"');
  });

  it("keeps the resume in the page while choosing, so printing prints the resume", () => {
    expect(bench(false)).toContain('id="resume-sheet"');
    const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
    expect(css).toContain(".desk[data-choosing=true] .sheet{display:none}");
    expect(css).toMatch(/@media print\{\.gallery\{display:none!important\}\.desk \.sheet\{display:block!important/);
    expect(css).toMatch(/prefers-reduced-motion:reduce\)\{\.sheet\[data-rolled=true\]\{animation:none\}/);
  });

  it("asks a new resume for a layout, and opens a saved one on its preview", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio).toContain("const [templatePicked, setTemplatePicked] = useState(Boolean(opened));");
    expect(studio).toContain("templateChosen={templatePicked}");
    const reopened = renderToStaticMarkup(createElement(ResumeStudio,{target:null,recordAt:"2026-10-03",profile:{version:1,createdAt:"2026-10-03",education:[],experience:[],projects:[],achievements:[],preferences:{resumeLedger:[{at:"2026-10-03",role:"Support",template:"classic",resume:SAMPLE_RESUME}]}}}));
    expect(reopened).toContain('data-choosing="false"');
  });

  it("says plainly that facts edited here reach the profile", () => {
    const html = bench(true);
    expect(html).toContain("also update your profile");
    expect(html).not.toContain("not your profile");
  });
});

it("lets the three tools share the toolbar's width, one row of three on a phone", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain(".toolTabs{flex:1 1 auto;min-width:0}");
  expect(css).toMatch(/\.toolTabs button\{display:flex;flex:1 1 0;/);
  expect(css).toContain(".toolTabs{width:100%;display:grid;grid-template-columns:repeat(3,1fr)}");
});

it("gives spare width to editing, capping the page side at what an A4 sheet needs", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain(".workspace{display:grid;grid-template-columns:minmax(320px,1fr) minmax(0,860px);");
});

describe("the preview follows what is being edited", async () => {
  const { ResumeSheet } = await import("./resume-sheet");
  const sheet = (focus?: { section: string; entry?: number }) =>
    renderToStaticMarkup(createElement(ResumeSheet, { resume: SAMPLE_RESUME, template: "classic", focus }));

  it("marks the open section when no entry is chosen", () => {
    const html = sheet({ section: "summary" });
    expect(html).toMatch(/<section[^>]*data-resume-section="summary"[^>]*data-editing=""/);
    expect(html.match(/data-editing=""/g)).toHaveLength(1);
  });

  it("marks only the entry being edited inside a section", () => {
    const html = sheet({ section: "experience", entry: 0 });
    expect(html).toMatch(/data-resume-entry="0" data-editing=""/);
    expect(html).not.toMatch(/data-resume-section="experience"[^>]*data-editing/);
    expect(html.match(/data-editing=""/g)).toHaveLength(1);
  });

  it("marks the name and the contact line when the whole header is meant", () => {
    expect(sheet({ section: "header" }).match(/data-editing=""/g)).toHaveLength(2);
  });

  it("marks nothing where no one is editing: downloads, printing and layout cards", () => {
    expect(sheet()).not.toContain("data-editing");
  });

  it("tells the preview which entry a field belongs to, and scrolls only beside the editor", () => {
    const editor = readFileSync("features/resume/resume-section-editor.tsx", "utf8");
    expect(editor).toContain('<fieldset className={s.entry} key={i} data-entry={i}>');
    const bench = readFileSync("features/resume/resume-workbench.tsx", "utf8");
    expect(bench).toContain('focus={tool === "content" ? editing : null}');
    expect(bench).toMatch(/if \(!editing \|\| tool !== "content" \|\| !window\.matchMedia\("\(min-width: 681px\)"\)\.matches\) return;/);
    expect(bench).toContain('scrollIntoView({ block: "nearest"');
    const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
    expect(css).toContain("@media print{.paper [data-editing]{background:none!important;outline:0!important}.paper [data-editing]::before{display:none!important}}");
  });
});

it("names the builder's steps without numbers", () => {
  const html = renderToStaticMarkup(createElement(ResumeStudio, { target: null, profile: { version: 1, createdAt: "2026-10-09", education: [], experience: [], projects: [], achievements: [], preferences: {} } }));
  const nav = html.match(/<nav[^>]*aria-label="Resume stages"[\s\S]*?<\/nav>/)?.[0] ?? "";
  expect(nav.match(/<button/g)?.length).toBe(4);
  expect(nav).not.toMatch(/>\s*[1-4]\s/);
  expect(nav).not.toContain('<span aria-hidden="true">');
});

it("highlights as soon as a box is selected, and clears when the person moves on", () => {
  const bench = readFileSync("features/resume/resume-workbench.tsx", "utf8");
  // Clicking or tabbing into a box sets it, typing keeps it; focus on a button or another section clears it.
  expect(bench).toContain("onFocus={noteField} onInput={noteField}");
  expect(bench).toContain('if (!box.matches("input:not([type=checkbox]):not([type=radio]),textarea,select")) { setEditing(null); return; }');
  expect(bench).toContain("const showSection = (next: ResumeSection) => { setSection(next); setEditing(null); };");
  expect(bench).toMatch(/const \[editing, setEditing\] = useState<SheetFocus \| null>\(null\);/);
  // Nothing is highlighted when the editor first opens.
  const html = renderToStaticMarkup(createElement(ResumeWorkbench, { resume: SAMPLE_RESUME, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {}, templateChosen: true }));
  expect(html).not.toContain("data-editing");
});

it("keeps the edit panel's side inset at 16px, with the section chips still spanning it", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain(".workbench .controls{padding-left:16px;padding-right:16px}");
  expect(css).toContain(".workbench .sectionTabs{margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px}");
});

it("has no side menu on the resume pages - My resumes is a button at the top", () => {
  for (const file of ["resume-studio.tsx", "saved-resumes.tsx", "guest-resume.tsx"]) expect(readFileSync(`features/resume/${file}`, "utf8")).not.toContain("ResumeNav");
  expect(readFileSync("features/resume/resume-studio.tsx", "utf8")).toContain('{stage === "start" ? "Create resume" : HEADINGS[stage][0]}');
});

it("lets the builder and My resumes fill the width beside the navigation rail", () => {
  expect(readFileSync("features/resume/resume-studio.module.css", "utf8")).toContain(".shell .canvas,.shell .main{max-width:none}");
  expect(readFileSync("features/resume/saved-resumes.module.css", "utf8").trimEnd().endsWith(".page{max-width:none}")).toBe(true);
});

describe("the preview points at the same part in every template", () => {
  const sheet = (template: ResumeTemplate, focus: SheetFocus) =>
    renderToStaticMarkup(createElement(ResumeSheet, { resume: SAMPLE_RESUME, template, roleLine: "Analyst", focus }));
  // What sits inside each highlighted element, up to its first closing tag of the same kind.
  const marked = (html: string) => [...html.matchAll(/<(\w+)[^>]*data-editing=""[^>]*>([\s\S]*?)<\/\1>/g)].map(m => m[2]);

  for (const { id } of TEMPLATES) {
    it(`${id}: the name, not the contact details, while the name is edited`, () => {
      const hits = marked(sheet(id, { section: "header", field: "header.name" }));
      expect(hits).toHaveLength(1);
      expect(hits[0]).toContain(SAMPLE_RESUME.header.name);
      expect(hits[0]).not.toContain(SAMPLE_RESUME.header.email);
    });
    it(`${id}: the contact details, not the name, while the email is edited`, () => {
      const hits = marked(sheet(id, { section: "header", field: "header.email" }));
      expect(hits).toHaveLength(1);
      expect(hits[0]).not.toContain(SAMPLE_RESUME.header.name);
    });
    it(`${id}: one experience entry, the one being edited`, () => {
      const hits = marked(sheet(id, { section: "experience", entry: 0, field: "experience.title" }));
      expect(hits).toHaveLength(1);
      expect(hits[0]).toContain(SAMPLE_RESUME.experience[0].title);
    });
  }

  it("draws the highlight below the gap left by a page break, not across it", () => {
    const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
    expect(css).toContain(".paper [data-editing][data-pushed]::before{content:\"\";position:absolute;inset:calc(var(--push-gap,0px) - 3px) -3px -3px;");
    const page = readFileSync("features/resume/resume-sheet.tsx", "utf8");
    expect(page).toContain('child.style.setProperty("--push-gap", gap);');
    expect(page).toContain('pushed.style.removeProperty("--push-gap");');
  });
});

it("wears the Material look in Ascend's greys: ticks, a \"!\" for what is needed, labels in the border", () => {
  const html = renderToStaticMarkup(createElement(ResumeWorkbench, { resume: { ...SAMPLE_RESUME, summary: "" }, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {}, templateChosen: true }));
  // Only the chosen tool carries a tick.
  const tools = html.match(/aria-label="Resume tools"[\s\S]*?<\/div>/)?.[0] ?? "";
  expect(tools.match(/<svg/g)).toHaveLength(1);
  expect(tools).toMatch(/aria-pressed="true"[^>]*><svg[\s\S]*?<\/svg>Edit sections/);
  // The summary is still needed: its chip has the "!" circle, not a dot.
  expect(html).toMatch(/data-state="needed"[^>]*><svg[^>]*><circle cx="12" cy="12" r="9.5"><\/circle><path d="M12 7.5v5.5">/);
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain(".workbench .fields .field .fieldHead{position:absolute;");
  expect(css).not.toMatch(/===== The Material look[\s\S]*(teal|emerald|green|violet-50)/);
});

it("matches the Material reference: chips straight into fields, 32px chips with 44px targets, icon undo, editor a little under half", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain("@media(min-width:901px){.workbench .workspace{grid-template-columns:minmax(420px,46fr) minmax(0,54fr)}");
  expect(css).toContain(".workbench .sectionTabs button::before{content:\"\";position:absolute;inset:-6px 0}");
  const html = renderToStaticMarkup(createElement(ResumeWorkbench, { resume: SAMPLE_RESUME, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {}, templateChosen: true }));
  expect(html).not.toContain("Make every section yours.");
  expect(html).not.toContain("Changes appear on the page as you type.");
  expect(html).not.toContain("YOUR RESUME");
  expect(html).toMatch(/aria-label="Undo edit"[^>]*><svg/);
});

it("pins the toolbar to the top when the app header has no height, and the edit panel right under it", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain("@media(min-width:761px){.workbench{--bar-top:0px}}");
  expect(css).toContain(".workbench .controls{top:calc(var(--bar-top) + var(--toolbar-h,72px));");
  // The header really is zero tall there.
  expect(readFileSync("app/product-design.css", "utf8")).toContain("@media(min-width:761px){body>header[data-product-header]{padding:0;border:0;height:0;min-height:0}}");
  expect(readFileSync("features/resume/resume-workbench.tsx", "utf8")).toContain('bench.current?.style.setProperty("--toolbar-h", `${bar.offsetHeight}px`)');
});

it("keeps the tools a compact segmented button with 14px labels, like Material's", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain("@media(min-width:681px){.workbench .toolTabs{flex:0 0 auto}.workbench .toolTabs button{flex:0 0 auto;min-width:150px}}");
  expect(css).toContain(".workbench .toolTabs button{min-height:44px;padding:0 20px;font-size:14px;");
  expect(css).toContain(".workbench .sectionTabs button{min-height:40px;padding:0 14px;gap:6px;font-size:14px;");
});

it("stops the pinned panels above the pinned action bar, so nothing at their foot is hidden", () => {
  const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(css).toContain("max-height:calc(100vh - var(--bar-top) - var(--toolbar-h,72px) - var(--footer-h,0px))");
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).toContain('shell.style.setProperty("--footer-h", pinned ?');
});

it("never leaves the main buttons disabled when the review is left while it is being written", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  const effect = studio.slice(studio.indexOf("// ---- AI Recruiter Review: read back when the stage opens ----"), studio.indexOf("reviewAttempt]);"));
  // No cancel that returns before "reviewing" is cleared.
  expect(effect).not.toContain("if (cancelled) return;");
  expect(effect).toContain('if (reviewsRunning.current === 0) setBusy(current => (current === "reviewing" ? null : current));');
  // Try again really asks again.
  expect(studio).toContain("setReviewAttempt(n => n + 1);");
});



it("makes the upload plainly an action: a file button, and a place to drop one", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).toContain('id="resume-upload" className={s.primary}');
  expect(studio).toContain('{uploading ? "Reading…" : "Choose a file"}');
  expect(studio).toContain("const file = e.dataTransfer.files[0]; if (file && !uploading) void readExisting(file);");
});

it("treats saving a PDF like a Word download: the version is kept and the AI Recruiter Review follows", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  const exporting = studio.slice(studio.indexOf("async function exportResume()"), studio.indexOf("const { dirty, saveLabel"));
  // No early return after the print dialog: both formats reach setExported(true) and the save.
  expect(exporting).not.toMatch(/window\.print\(\);[\s\S]*?return;\s*\}/);
  expect(exporting).toContain("setBusy(null); setExported(true);");
  expect(exporting).toContain("downloaded: true");
});

it("heads the AI Recruiter Review plainly - no subtitle and no ⓘ", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).not.toContain("ReviewInfo");
  expect(studio).not.toContain("How a recruiter would read your resume. Optional.");
});

it("keeps My resumes at the top right of every step, saving any edits before it leaves", () => {
  const html = renderToStaticMarkup(createElement(ResumeStudio, { target: null, profile: { version: 1, createdAt: "2026-10-10", education: [], experience: [], projects: [], achievements: [], preferences: {} } }));
  const heading = html.match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? "";
  expect(heading).toMatch(/href="\/resume\/saved"[^>]*>[\s\S]*?My resumes<\/a>/);
  expect(readFileSync("features/resume/resume-studio.tsx", "utf8")).toContain('onClick={event => leaveTo("/resume/saved", event)}');
});

it("keeps Continue disabled until a way to start is chosen", () => {
  const html = renderToStaticMarkup(createElement(ResumeStudio, { target: null, profile: { version: 1, createdAt: "2026-10-10", education: [], experience: [], projects: [], achievements: [], preferences: { fullName: "A. Sample" } } }));
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
  expect(footer).toMatch(/<button[^>]*disabled=""[^>]*>Continue/);
});

it("reads 'Your experience' from the profile the way the profile page does", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).toContain("const studyingNow = readEducation(profile.education).filter(hasSubstance).some(entry => Boolean(entry.current));");
  expect(studio).toContain("const hasWork = readExperience(profile.experience).some(hasSubstance);");
  expect(studio).toContain("useState<Track | null>(initialTrack ?? recordTrack)");
});

describe("Download and the AI Recruiter Review wait for the required details", () => {
  const studio = (resume: typeof SAMPLE_RESUME) => renderToStaticMarkup(createElement(ResumeStudio, { target: null, recordAt: "2026-10-11", profile: { version: 1, createdAt: "2026-10-11", education: [], experience: [], projects: [], achievements: [], preferences: { resumeLedger: [{ role: "Support", at: "2026-10-11", template: "classic", resume }] } } }));
  const nav = (html: string) => html.match(/<nav[^>]*aria-label="Resume stages"[\s\S]*?<\/nav>/)?.[0] ?? "";

  it("locks both, and says why, while a required detail is missing", () => {
    const html = nav(studio({ ...SAMPLE_RESUME, summary: "" }));
    expect(html.match(/data-locked="true"/g)).toHaveLength(2);
    expect(html).toContain("(add the required details first)");
  });

  it("opens both once the resume carries what it needs", () => {
    expect(nav(studio(SAMPLE_RESUME))).not.toContain("data-locked");
  });

  it("sends a locked step, and Continue to download, to what is missing", () => {
    const code = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(code).toContain("if (locked(id)) { openMissing(completeness.missing[0]!); setStatus(missingLine()); return; }");
    expect(code).toContain('if (stage === "draft") return openStage("export");');
  });
});

it("keeps Work on my resume disabled until a resume has been uploaded and read", () => {
  const code = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(code).toContain('(stage === "start" && (!purpose || (purpose === "improve" && !upload)))');
  expect(code).toContain('["Upload your resume to continue.", "PDF or Word - we keep what you wrote.", "Work on my resume"]');
});

it("shows no warnings, and no blank page, before anything is typed", () => {
  const blank = { ...SAMPLE_RESUME, header: { name: "", email: "", city: "" }, summary: "", experience: [], education: [], skills: [], projects: [], achievements: [], certifications: [], activities: [], languages: [], interests: [] };
  const html = renderToStaticMarkup(createElement(ResumeWorkbench, { resume: blank, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {}, templateChosen: true }));
  expect(html).not.toContain('data-state="needed"');
  expect(html).toContain("Your resume appears here as you type");
});

it("gives the signed-out builder one clear account card, styled choices and a quiet Start over", () => {
  const guest = readFileSync("features/resume/guest-resume.tsx", "utf8");
  expect(guest).toContain(">Save it to your account</h2>");
  expect(guest).toContain(">Create an account</Link>");
  expect(guest).toContain("<legend>Your experience</legend>");
  expect(guest).toContain('>Start over</button>');
  expect(guest).not.toContain("Clear browser draft");
  expect(guest).not.toContain("Resume guidance · switching keeps your draft");
});

it("shows the layouts with sample content, not blank, before anything is typed", () => {
  const code = readFileSync("features/resume/resume-workbench.tsx", "utf8");
  expect(code).toContain('resume={started ? resume : track === "early_career" ? SAMPLE_RESUME : STUDENT_SAMPLE}');
});

it("shows a signed-out visitor every way to start, marking the ones an account opens", () => {
  const guest = readFileSync("features/resume/guest-resume.tsx", "utf8");
  expect(guest).toContain(">How would you like to start?</h2>");
  for (const way of ["Write it myself", "Upload a resume", "Fill in my details"]) expect(guest).toContain(`<strong>${way}</strong>`);
  expect(guest.match(/>With an account</g)).toHaveLength(2);
  // A draft already in this browser goes straight back to its editor.
  expect(guest).toContain("const [writing, setWriting] = useState(hadDraft);");
});

it("explains Upload and Fill in my details before asking for an account, and comes back to them", () => {
  const guest = readFileSync("features/resume/guest-resume.tsx", "utf8");
  expect(guest).toContain('onClick={() => setNeedsAccount("upload")}');
  expect(guest).toContain("Reading a file needs an account - create one and you come straight back here, ready to upload.");
  expect(guest).toContain("`/signup?next=${encodeURIComponent(`/resume/build?start=${needsAccount}`)}`");
  expect(guest).toContain(">Write it myself instead</button>");
  const page = readFileSync("app/(student)/resume/build/page.tsx", "utf8");
  expect(page).toContain('initialPurpose={start === "upload" ? "improve" : start === "details" ? "general" : undefined}');
  expect(readFileSync("features/resume/resume-studio.tsx", "utf8")).toContain("useState<Purpose | null>(initialPurpose ?? null)");
});
