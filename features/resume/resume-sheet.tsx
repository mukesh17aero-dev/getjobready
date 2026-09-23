"use client";

// The rendered resume: A4 pages, sections and the sheet itself.

export const A4_WIDTH = "210mm";
export const A4_PX = 794; // 210mm at 96dpi, for working out how far to scale it
export const A4_PAGE_PX = 297 * (96 / 25.4); // one page, top to bottom
import { TEMPLATES } from "./templates";
import { useEffect, useRef, useState } from "react";
import { type ResumeData, type ResumeTemplate } from "./resume-api";
const PAGE_GUTTER_PX = 24; // the gap between two sheets on a desk

/**
 * Holds an A4 page inside whatever space is going, scaled to fit the width.
 * The page keeps its real dimensions - only the viewing scale changes - so
 * line breaks and page breaks are the ones the paper will have.
 */
function Page({
  id,
  className,
  inner,
  children,
  onPages,
  watermark,
}: {
  id?: string;
  className: string;
  /** Padding and font for the content inside the margins. */
  inner: string;
  children: React.ReactNode;
  /** Told how many whole A4 pages this came to. */
  onPages?: (pages: number) => void;
  /** A word stamped across the middle of every sheet - "Draft", "Example". */
  watermark?: string;
}) {
  const content = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState(1);
  // Held in a ref so a new callback identity cannot restart the observer.
  const onPagesRef = useRef(onPages);
  useEffect(() => {
    onPagesRef.current = onPages;
  }, [onPages]);

  useEffect(() => {
    const el = content.current;
    if (!el) return;

    // Sheets of paper, not a roll. Each section is measured against the foot
    // of the page it lands on, and anything that would straddle the fold is
    // pushed down to the top of the next sheet - which is what a printer
    // does, and what a person looking at their own resume expects to see.
    const fit = () => {
      const unit = A4_PAGE_PX + PAGE_GUTTER_PX;
      const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
      const flows = el.querySelectorAll<HTMLElement>("[data-flow]");
      const columns: HTMLElement[] = flows.length ? [...flows] : [el];

      for (const pushed of el.querySelectorAll<HTMLElement>("[data-pushed]")) {
        pushed.style.paddingTop = "";
        delete pushed.dataset.pushed;
      }

      // The preview shows the page zoomed to fit, and a zoomed element
      // reports zoomed rectangles - so every measurement is converted back
      // to the page's own units first. Comparing visual pixels against a
      // page height in layout pixels is how a fold ends up in the wrong
      // place, or nowhere at all.
      const zoom = el.getBoundingClientRect().width / el.offsetWidth || 1;
      const top = el.getBoundingClientRect().top / zoom;
      const room = A4_PAGE_PX - pad * 2;

      // Walk down until something small enough to move is found. A whole
      // section is moved when it fits on a page; when it does not - a long
      // employment history always outgrows one - the entries inside it are
      // moved instead, so the fold falls between two jobs rather than
      // through the middle of one.
      const clear = (parent: HTMLElement, depth: number): void => {
        for (const child of [...parent.children] as HTMLElement[]) {
          const rect = child.getBoundingClientRect();
          const box = {
            top: rect.top / zoom,
            bottom: rect.bottom / zoom,
            height: rect.height / zoom,
          };
          const from = box.top - top;
          const page = Math.floor(from / unit);
          const foot = page * unit + A4_PAGE_PX - pad;
          if (box.bottom - top <= foot) continue;
          // Small enough to move whole - a heading with two lines under it,
          // one job, the languages block - so move it. Anything bigger gets
          // broken inside instead: pushing a whole employment history to the
          // next page would leave half of this one blank, which is not what
          // a printer does and not what anyone wants to look at.
          const movable = box.height <= Math.min(room, A4_PAGE_PX * 0.35);
          if (movable || child.children.length === 0 || depth >= 3) {
            if (box.height > room) continue;
            child.style.paddingTop = `${(page + 1) * unit + pad - from}px`;
            child.dataset.pushed = "true";
          } else {
            clear(child, depth + 1);
          }
        }
      };

      for (const column of columns) clear(column, 0);

      const deepest = el.getBoundingClientRect().bottom / zoom - top;
      const count = Math.max(1, Math.ceil((deepest + pad) / unit - 0.01));
      setPages(count);
      onPagesRef.current?.(count);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      className="relative print:block"
      style={{
        width: A4_WIDTH,
        height: `${pages * A4_PAGE_PX + (pages - 1) * PAGE_GUTTER_PX}px`,
      }}
    >
      {/* One white rectangle per sheet, with real space between them, so two
          pages read as two pages. Print drops them: the paper is the paper. */}
      <div aria-hidden className="absolute inset-0 print:hidden">
        {Array.from({ length: pages }, (_, i) => (
          <div
            key={i}
            className={`${className} grid place-items-center overflow-hidden`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${i * (A4_PAGE_PX + PAGE_GUTTER_PX)}px`,
              height: `${A4_PAGE_PX}px`,
            }}
          >
            {watermark ? (
              <span className="select-none text-[6rem] font-bold uppercase tracking-[0.3em] text-[#111827]/[0.06]">
                {watermark}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div ref={content} className={`relative ${inner}`}>
        {children}
      </div>
    </div>
  );
}

/** Exported with ResumeSheet: it is what scales an A4 page to its box. */
export function A4Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / A4_PX));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className={className}>
      {/* zoom rather than transform: a transform leaves the layout at full
          size, and there is then nothing sane to scroll. */}
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}

export function MiniPreview({
  id,
  resume,
  roleLine,
  track,
}: {
  id: ResumeTemplate;
  resume: ResumeData;
  roleLine: string;
  track?: "student" | "early_career";
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none aspect-[1/1.414] select-none overflow-hidden rounded-md border border-[#cbd2da] bg-white shadow-sm"
    >
      <A4Frame>
        <ResumeSheet
          resume={resume}
          template={id}
          roleLine={roleLine}
          track={track}
          mini
        />
      </A4Frame>
    </div>
  );
}

// Native radios (visually hidden, cards styled through peer classes) so the
// picker is keyboard-accessible for free: Tab reaches it, arrow keys move
// the choice. Violet marks the selection - Ascend guiding a choice, not an
// earned fact.
export function TemplatePicker({
  value,
  onChange,
  track,
  resume,
  roleLine,
}: {
  value: ResumeTemplate;
  onChange: (template: ResumeTemplate) => void;
  /** The preview content - the person's own name where the record has it. */
  resume: ResumeData;
  roleLine: string;
  /** So each thumbnail is ordered the way their own page will be. */
  track?: "student" | "early_career";
}) {
  // No preview dialog here: the workbench keeps a full-size page beside the
  // picker, so the thumbnails only have to say which look is which.
  return (
    <fieldset>
      <legend className="text-[0.8rem] font-semibold text-slate-800">
        Pick a look
      </legend>
      <p className="mt-0.5 text-[0.72rem] text-slate-400">
        Classic and Compact are single column - the safest read for screening
        software. Sidebar is a designed two-column look, best when a person
        reads it. Switch any time.
      </p>
      {/* A row of pages, side by side, the way anybody would lay printed
          samples on a desk to choose between them. It scrolls sideways where
          the rail is too narrow rather than stacking into a list. */}
      {/* Three equal columns, spanning the rail: fixed-width cards left half
          the row empty. Below sm they stack. */}
      <ul className="mt-2.5 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        {TEMPLATES.map((t) => (
          <li key={t.id} className="min-w-0">
            <label className="block cursor-pointer">
              <input
                type="radio"
                name="resume-template"
                value={t.id}
                checked={value === t.id}
                onChange={() => onChange(t.id)}
                className="peer sr-only"
              />
              <span className="block rounded-xl border-2 border-slate-200 bg-surface p-1.5 transition-colors peer-checked:border-brand-violet peer-checked:bg-brand-violet/5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-violet/40">
                <span className="block overflow-hidden rounded-md">
                  <MiniPreview
                    id={t.id}
                    resume={resume}
                    roleLine={roleLine}
                    track={track}
                  />
                </span>
                <span className="mt-1.5 block text-center text-[0.78rem] font-semibold text-brand-ink">
                  {t.name}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

// ---- The rendered resume ----
//
// The sheet is fixed white in every theme, so it keeps literal ink hexes
// instead of app theme tokens - in all three templates.

// The three looks follow resume.io's ATS set: Classic wears the serif
// "Traditional" suit, Compact the tight sans "Simple ATS", and Sidebar the
// two-column "Stockholm" arrangement. Classic and Compact stay single
// column, so a screener reads them exactly alike.
type SheetStyles = {
  pad: string;
  /** Root font family for the whole sheet. */
  font: string;
  /** "split" = contact flush right of the name; "stack" = beneath it; "center" = both centred. */
  headerLayout: "split" | "stack" | "center";
  name: string;
  contact: string;
  section: string;
  heading: string;
  body: string;
  item: string;
  itemTitle: string;
  stack: string;
  /** Dates sit flush right of the item title line. */
  dateRight: boolean;
};

const SHEET_STYLES: Record<ResumeTemplate, SheetStyles> = {
  // Sizes are in points, because the page is now a real A4 page and points
  // are what a printed resume is set in. They are also what makes an
  // ordinary record fill the sheet: type meant for a fluid column left a
  // third of the paper white, and white space at the foot of a resume reads
  // as a person with little to say.
  classic: {
    pad: "p-[15mm]",
    font: "font-serif",
    headerLayout: "split",
    name: "text-[24pt] font-bold tracking-tight text-[#111827]",
    contact: "text-[10pt] leading-relaxed",
    section: "mt-[6mm]",
    heading: "border-b-2 border-[#111827] pb-1 text-[12pt] font-bold",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  compact: {
    pad: "p-[14mm]",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[23pt] font-bold tracking-tight text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[6mm]",
    heading:
      "border-b border-[#9ca3af] pb-0.5 text-[9pt] font-bold uppercase tracking-[0.14em]",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[3.5mm]",
    dateRight: false,
  },
  sidebar: {
    pad: "p-[15mm]",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[26pt] font-bold uppercase leading-[1.1] tracking-[0.02em] text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[6.5mm]",
    heading:
      "text-[11pt] font-bold uppercase tracking-[0.1em] after:mt-1 after:block after:h-[3px] after:w-8 after:bg-[#111827]",
    body: "text-[11pt] leading-[1.5]",
    item: "text-[11pt] leading-[1.5]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  // Three more single-column looks. Like Classic and Compact they use no
  // tables, columns or graphics, so a screener reads them exactly alike.
  minimal: {
    pad: "p-[16mm]",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[22pt] font-semibold tracking-tight text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[7mm]",
    heading: "text-[9pt] font-semibold uppercase tracking-[0.2em] text-[#6b7280]",
    body: "text-[11pt] leading-[1.5]",
    item: "text-[11pt] leading-[1.5]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  graduate: {
    pad: "p-[15mm]",
    font: "font-serif",
    headerLayout: "center",
    name: "text-[24pt] font-bold uppercase tracking-[0.08em] text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[6mm]",
    heading: "border-b border-[#111827] pb-1 text-center text-[11pt] font-bold uppercase tracking-[0.14em]",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  professional: {
    pad: "p-[14mm]",
    font: "font-sans",
    headerLayout: "split",
    name: "text-[26pt] font-bold tracking-tight text-[#111827]",
    contact: "text-[10pt] leading-relaxed",
    section: "mt-[6mm]",
    heading: "bg-[#111827] px-2 py-0.5 text-[9.5pt] font-bold uppercase tracking-[0.12em] !text-white",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
};

// "EMPLOYMENT HISTORY" -> "Employment history": headings can arrive
// pre-uppercased, so the non-caps templates sentence-case them.
const sentenceCase = (text: string) =>
  text.toLowerCase().replace(/^./, (c) => c.toUpperCase());

function Section({
  title,
  styles,
  children,
}: {
  title: string;
  styles: SheetStyles;
  children: React.ReactNode;
}) {
  const caps = styles.heading.includes("uppercase");
  return (
    <section className={styles.section}>
      <h3 className={`${styles.heading} text-[#111827]`}>
        {caps ? title : sentenceCase(title)}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

// The item title line: role and organisation on the left, dates either
// flush right (Classic, Modern) or trailing the title (Compact).
function ItemLine({
  title,
  period,
  styles,
}: {
  title: string;
  period: string;
  styles: SheetStyles;
}) {
  if (styles.dateRight) {
    return (
      <div className="flex items-baseline justify-between gap-4">
        <p className={styles.itemTitle}>{title}</p>
        {period && (
          <p className={`shrink-0 ${styles.item} text-[#6b7280]`}>{period}</p>
        )}
      </div>
    );
  }
  return (
    <p className={styles.itemTitle}>
      {title}
      {period && (
        <span className="ml-2 font-normal text-[#6b7280]">· {period}</span>
      )}
    </p>
  );
}

/**
 * Exported so a landing page can show the real thing.
 *
 * Anything that renders a resume anywhere in the product renders it through
 * here. A hand-drawn approximation on a marketing surface is a promise the
 * app then has to keep, and it starts drifting the first time either side
 * changes - so there is one renderer and the preview uses it.
 */
export function ResumeSheet({
  resume,
  template,
  roleLine,
  mini = false,
  onPages,
  watermark,
  track = "early_career",
}: {
  resume: ResumeData;
  template: ResumeTemplate;
  /** The role this resume targets - sits under the name in the sidebar look. */
  roleLine?: string;
  /** Scaled-down picker preview: no print id, the card supplies the frame. */
  mini?: boolean;
  /** Told how many A4 pages the finished sheet came to. */
  onPages?: (pages: number) => void;
  /** Stamped across the middle of every sheet; never printed. */
  watermark?: string;
  /**
   * Who the page is for, which decides what a recruiter meets first.
   *
   * A student leads with education and projects because that is the evidence
   * they have; somebody with a job leads with the job. The backend already
   * writes to this rule, but order lives here, in the layout - so without
   * this the written page came back in the wrong order whatever it said.
   */
  track?: "student" | "early_career";
}) {
  const t = SHEET_STYLES[template];
  const student = track === "student";

  // The sections, built once and arranged differently per layout.
  const profile = resume.summary ? (
    <Section title={resume.summaryHeading || "Summary"} styles={t}>
      <p className={`whitespace-pre-line ${t.body}`}>{resume.summary}</p>
    </Section>
  ) : null;

  const skills = resume.skills.length > 0 && (
    <Section title="Skills" styles={t}>
      <ul className="grid gap-1">
        {resume.skills.map((group) => (
          <li key={group.group} className={t.body}>
            <strong className="font-semibold">{group.group}:</strong>{" "}
            {group.items.join(", ")}
          </li>
        ))}
      </ul>
    </Section>
  );

  const experience = resume.experience.length > 0 && (
    <Section
      title={resume.experienceHeading || "Employment history"}
      styles={t}
    >
      <div className={t.stack}>
        {resume.experience.map((item, i) => (
          <div key={`${item.title}-${i}`}>
            <ItemLine
              title={[item.title, item.organisation].filter(Boolean).join(", ")}
              period={item.period}
              styles={t}
            />
            <ul className="mt-1 grid gap-0.5 pl-4">
              {item.bullets.map((point) => (
                <li key={point} className={`list-disc ${t.item}`}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );

  const education = resume.education.length > 0 && (
    <Section title="Education" styles={t}>
      <div className="grid gap-2">
        {resume.education.map((item, i) => (
          <div key={`${item.qualification}-${i}`}>
            <ItemLine
              title={[item.qualification, item.institution]
                .filter(Boolean)
                .join(", ")}
              period={item.period}
              styles={t}
            />
            {item.detail && (
              <p className={`${t.item} text-[#4b5563]`}>{item.detail}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  // The sections a fresher's resume is mostly made of. Each is absent rather
  // than empty: a heading with nothing under it advertises a gap.
  const projects = (resume.projects?.length ?? 0) > 0 && (
    <Section title="Projects" styles={t}>
      <div className={t.stack}>
        {resume.projects!.map((project) => (
          <div key={project.title}>
            <p className={t.itemTitle}>{project.title}</p>
            {project.detail && <p className={t.item}>{project.detail}</p>}
            {project.tools.length > 0 && (
              <p className={`${t.item} text-[#4b5563]`}>
                {project.tools.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  const certifications = (resume.certifications?.length ?? 0) > 0 && (
    <Section title="Certifications" styles={t}>
      <ul className="grid gap-0.5 pl-4">
        {resume.certifications!.map((c) => (
          <li key={c.title} className={`list-disc ${t.item}`}>
            {c.title}
            {c.issuer ? `, ${c.issuer}` : ""}
            {c.year ? ` (${c.year})` : ""}
          </li>
        ))}
      </ul>
    </Section>
  );

  const achievements = (resume.achievements?.length ?? 0) > 0 && (
    <Section title="Achievements" styles={t}>
      <ul className="grid gap-0.5 pl-4">
        {resume.achievements!.map((line) => (
          <li key={line} className={`list-disc ${t.item}`}>
            {line}
          </li>
        ))}
      </ul>
    </Section>
  );

  const interests = (resume.interests?.length ?? 0) > 0 && (
    <Section title="Interests" styles={t}>
      <p className={t.body}>{resume.interests!.join(", ")}</p>
    </Section>
  );

  const languages = resume.languages.length > 0 && (
    <Section title="Languages" styles={t}>
      <p className={t.body}>{resume.languages.join(", ")}</p>
    </Section>
  );

  const activities = resume.activities.length > 0 && (
    <Section title="Activities" styles={t}>
      <ul className="grid gap-0.5 pl-4">
        {resume.activities.map((activity) => (
          <li key={activity} className={`list-disc ${t.item}`}>
            {activity}
          </li>
        ))}
      </ul>
    </Section>
  );

  // A4, in millimetres, because that is what it is. The page is 210mm wide
  // and at least one 297mm page tall; content longer than that rolls onto a
  // second page rather than stretching the first, and a hairline is drawn
  // where each page ends so nobody is surprised by page two at the printer.
  const paperClass = `bg-white ${
    mini ? "" : "rounded-xl border border-slate-200 shadow-sm"
  }`;
  const inkClass = `break-words text-[#111827] ${t.font} ${t.pad}`;

  if (template === "sidebar") {
    const info = (resume.header.city ||
      resume.header.email ||
      resume.header.phone ||
      resume.header.link) && (
      <Section title="Info" styles={t}>
        <div className="grid gap-1.5">
          {resume.header.city && <p className={t.item}>{resume.header.city}</p>}
          {resume.header.phone && (
            <p className={t.item}>{resume.header.phone}</p>
          )}
          {resume.header.email && (
            <p className={t.item}>{resume.header.email}</p>
          )}
          {resume.header.link && <p className={t.item}>{resume.header.link}</p>}
        </div>
      </Section>
    );
    return (
      <Page
        id={mini ? undefined : "resume-sheet"}
        className={paperClass}
        inner={inkClass}
        onPages={onPages}
        watermark={watermark}
      >
        <h2 className={t.name}>{resume.header.name}</h2>
        {roleLine && (
          <p className={`${t.contact} text-[#6b7280]`}>{roleLine}</p>
        )}
        {/* One layout grid, real headings in both columns: reading order is
            the narrow column then the wide one. */}
        {/* min-w-0 lets the narrow column shrink, and overflow-wrap breaks a
            long email or link instead of letting it cross the divider. */}
        <div className="mt-5 grid gap-x-6 gap-y-1 border-t border-[#d1d5db] pt-4 sm:grid-cols-[10rem_1fr]">
          <div
            data-flow
            className="min-w-0 border-[#e5e7eb] [overflow-wrap:anywhere] sm:border-r sm:pr-5"
          >
            {info}
            {skills}
            {languages}
            {certifications}
            {interests}
          </div>
          {/* A hairline between sections, as the reference layout has - the
              first section needs none, so only later siblings carry it. */}
          <div
            data-flow
            className="min-w-0 [&>section+section]:border-t [&>section+section]:border-[#e5e7eb] [&>section+section]:pt-4"
          >
            {profile}
            {student ? education : experience}
            {student ? projects : education}
            {student ? experience : projects}
            {achievements}
            {activities}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      id={mini ? undefined : "resume-sheet"}
      className={paperClass}
      inner={inkClass}
      onPages={onPages}
      watermark={watermark}
    >
      {t.headerLayout === "split" ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-[#d1d5db] pb-3">
          <h2 className={t.name}>{resume.header.name}</h2>
          {(resume.header.city ||
            resume.header.email ||
            resume.header.phone ||
            resume.header.link) && (
            <p className={`${t.contact} text-[#6b7280] sm:text-right`}>
              {[
                resume.header.city,
                resume.header.phone,
                resume.header.email,
                resume.header.link,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      ) : (
        <div className={t.headerLayout === "center" ? "border-b border-[#d1d5db] pb-3 text-center" : ""}>
          <h2 className={t.name}>{resume.header.name}</h2>
          {(resume.header.city ||
            resume.header.email ||
            resume.header.phone ||
            resume.header.link) && (
            <p className={`${t.contact} text-[#6b7280]`}>
              {[
                resume.header.city,
                resume.header.phone,
                resume.header.email,
                resume.header.link,
              ]
                .filter(Boolean)
                .join("  |  ")}
            </p>
          )}
        </div>
      )}
      {profile}
      {skills}
      {student ? education : experience}
      {projects}
      {student ? experience : education}
      {certifications}
      {achievements}
      {languages}
      {activities}
      {interests}
    </Page>
  );
}
