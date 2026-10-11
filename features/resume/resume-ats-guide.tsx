"use client";

import type { ResumeTemplate } from "./resume-api";
import type { ResumeSection } from "./resume-section-editor";
import s from "./resume-workbench.module.css";

export function ResumeAtsGuide({ template, disabled, onTemplate, onSection }: {
  template: ResumeTemplate; disabled: boolean;
  onTemplate: (template: ResumeTemplate) => void;
  onSection: (section: ResumeSection) => void;
}) {
  return <div className={s.atsGuide}>
    <div className={s.controlHeader}><span className={s.eyebrow}>MAKE YOUR EXPERIENCE EASY TO READ</span><h2>A resume people and software can read.</h2><p>Applicant tracking systems (ATS) extract details from your document. Clear structure helps; relevant, truthful evidence gives a recruiter a reason to keep reading.</p></div>
    <section><h3>1. Start with a simple layout</h3>{template === "sidebar" ? <><p>Your Sidebar layout has two columns, which can disrupt reading order in some systems.</p><button type="button" className={s.add} disabled={disabled} onClick={() => onTemplate("classic")}>Use Basic single-column layout</button></> : <p>Your selected layout uses one column. Keep familiar headings such as Summary, Experience, Education and Skills.</p>}</section>
    <section><h3>2. Show the experience you have</h3><p>First job? Use coursework, projects, volunteering or informal work. Changing careers? Highlight transferable contributions. Experienced? Lead with recent, relevant achievements. Describe each experience honestly.</p><button type="button" onClick={() => onSection("experience")}>Improve experience →</button></section>
    <section><h3>3. Turn duties into evidence</h3><p>Write: action + what you worked on + method + outcome. Add numbers only when you can verify them. A clear qualitative result is useful too.</p><p><strong>Illustrative example:</strong> “Created a shared handover checklist so the next shift could find unresolved customer requests.” Use your own facts.</p><button type="button" onClick={() => onSection("experience")}>Edit your bullet points →</button></section>
    <section><h3>4. Match the job truthfully</h3><p>Read the job description. Use its terms for skills and tools you actually have, supported by examples. Spell out uncommon abbreviations once. Avoid keyword repetition or hidden text.</p><button type="button" onClick={() => onSection("skills")}>Review skills →</button></section>
    <section><h3>5. Check the file you send</h3><p>Follow the employer’s requested file type. Open your downloaded PDF or Word file, select and copy its text into a plain-text editor, and check contact details, dates, bullet points and reading order. Review any fields the application fills automatically.</p></section>
    <p className={s.description}>This is guidance, not an ATS certification or a hiring score. Systems differ; no template guarantees acceptance.</p>
    <p className={s.description}>Learn more: <a href="https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse" target="_blank" rel="noreferrer">Greenhouse parsing guidance</a> · <a href="https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/" target="_blank" rel="noreferrer">Harvard resume guidance</a></p>
  </div>;
}
