"use client";

import Link from "next/link";
import type { HomeWorkItem, ProfileState, JobFitCheck } from "@/lib/api";
import { RememberHub } from "@/features/journey";
import type { ResumeSnapshot } from "./resume-excerpt";
import styles from "@/features/resume/apply-toolkit.module.css";

type ToolId = "resume" | "linkedin" | "fit";
const TOOLS = [
  { id: "resume", title: "Resume", copy: "A document you can edit and download.", href: "/resume/build", action: "Create a resume", icon: "▤" },
  { id: "linkedin", title: "LinkedIn", copy: "A headline and introduction that sound like you.", href: "/profile/professional", action: "Write my profile", icon: "in" },
  { id: "fit", title: "Job fit", copy: "Compare a job posting with your experience.", href: "/job-fit", action: "Check a job", icon: "◎" },
] as const;

export function ApplyWorkspace({ role, resume, professional, check, signedIn, available }: {
  name: string; photo?: string; role: string | null; work: HomeWorkItem[] | null; resume: ResumeSnapshot | null;
  professional: ProfileState | null; check: JobFitCheck | null; signedIn: boolean; available: Record<ToolId, boolean>;
}) {
  const hasProfile = Boolean(professional?.identity || professional?.suggested?.headline || professional?.suggested?.about || professional?.accepted?.headline || professional?.accepted?.about);
  const saved = { resume: signedIn && Boolean(resume), linkedin: signedIn && hasProfile, fit: signedIn && Boolean(check) };
  return <main className={styles.main}>
    <RememberHub path="/resume" />
    <nav className={styles.context} aria-label="Apply navigation"><Link href="/">← Home</Link><Link href="/resume/saved">My resumes →</Link></nav>
    {role && <div className={styles.direction}><span>{role}</span><Link href="/discover">Change direction</Link></div>}
    <header className={styles.heading}><p>YOUR APPLICATION TOOLKIT</p><h1>Make your experience count.</h1><span>Work, projects and volunteering all belong in your story.</span></header>
    <section className={styles.hero} aria-labelledby="resume-start-title"><div><h2 id="resume-start-title">Start with your resume.</h2><p>Add what you’ve done. Build a draft you can make your own.</p></div><Link className={styles.primary} href="/resume/build">Build my resume <span aria-hidden="true">→</span></Link></section>
    <div className={styles.tools}>{TOOLS.map(tool => <section className={styles.card} key={tool.id}>
      <span className={styles.icon} aria-hidden="true">{tool.icon}</span><h2>{tool.title}</h2><p>{tool.copy}</p>
      <span className={styles.status}>{signedIn && !available[tool.id] ? "Saved work unavailable" : saved[tool.id] ? tool.id === "fit" ? "Check saved" : "Draft saved" : tool.id === "fit" ? "No check yet" : "No draft yet"}</span>
      {/* A saved resume never takes the way to a new one away: building stays
          the card's action, and the saved ones sit beside it. */}
      <div className={styles.cardActions}>
        <Link className={styles.action} href={tool.href}>{saved[tool.id] && tool.id !== "resume" ? tool.id === "linkedin" ? "Open my profile" : "Open job fit" : tool.action} <span aria-hidden="true">→</span></Link>
        {saved[tool.id] && tool.id === "resume" && <Link className={styles.secondaryAction} href="/resume/saved">My resumes</Link>}
      </div>
    </section>)}</div>
    <p className={styles.note}>Your profile is reused across tools. Review suggestions before saving them.</p>
  </main>;
}
