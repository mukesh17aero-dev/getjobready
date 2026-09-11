import Link from "next/link";
import s from "./interview-workspace.module.css";

// The frame the interview pages share: a way back to the Interview hub,
// then the page's own heading. A server component - nothing here changes on
// the client.

export type WorkspacePage = "home" | "practice" | "questions";

export function InterviewWorkspaceFrame({ current, eyebrow, title, subtitle, children }: {
  current: WorkspacePage; eyebrow: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className={s.shell}>
      <div className={s.canvas}>
        <main className={s.main}>
          {current !== "home" && <Link className={s.back} href="/interview">← Interview practice</Link>}
          <header className={s.heading}><div><p className={s.eyebrow}>{eyebrow}</p><h1 tabIndex={-1}>{title}</h1><p>{subtitle}</p></div></header>
          {children}
        </main>
      </div>
    </div>
  );
}

