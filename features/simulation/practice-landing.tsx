import Link from "next/link";
import s from "./practice-landing.module.css";

export function PracticeLanding({ role, roleId, available, unavailable, course, assessment }: {
  role: string | null; roleId: string | null; available: boolean; unavailable: boolean;
  course: { title: string; status: string; percent: number; completed?: number; total?: number } | null;
  assessment: { score: number; title: string; basis: string; confidence: string; date: string } | null;
}) {
  const href = available && roleId ? `/practice/missions?role=${encodeURIComponent(roleId)}` : "/practice/missions";
  return <main className={s.main}>
    <nav className={s.context} aria-label="Practice navigation"><Link href="/">← Home</Link><Link href="/discover">{role ?? "Choose a role"}{role && " · Change direction"}</Link></nav>
    <header className={s.heading}><p>LEARN BY DOING</p><h1>Try the work before your first day.</h1><span>See an example, try a task and learn from the feedback.</span></header>
    {(unavailable || (role && !available)) && <section className={s.notice} aria-label="Practice availability"><h2>{unavailable ? "We couldn’t check practice availability." : `${role} missions aren’t available yet.`}</h2><p>{unavailable ? "Open the practice catalogue to try again." : "Explore available practice without changing your chosen direction."}</p></section>}
    <div className={s.grid}><section className={s.task} data-focal-panel><span className={s.tag}>{available ? "YOUR ROLE PRACTICE" : "EXPLORE AVAILABLE PRACTICE"}</span><h2>{course?.title ?? (available ? `Practise ${role}` : "Find a task to try.")}</h2><p>Work through a workplace situation, use the reference cards and get feedback on your response.</p>{course && <div className={s.progress}><p>{course.status}{course.completed !== undefined && course.total !== undefined ? ` · ${course.completed} of ${course.total} steps` : ` · ${course.percent}% complete`}</p><progress aria-label="Simulation completion" value={course.percent} max={100} /></div>}<Link className={s.primary} href={href}>{course && course.status !== "Not started" ? "Continue my practice" : available ? "Start my practice" : "See available practice"} →</Link></section>
    <aside className={s.loop}><h2>A simple practice loop</h2><ol>{[["See an example", "Understand what good work looks like."],["Try it yourself", "Use the records and reference cards."],["Use the feedback", "Improve one thing, then try again."]].map(([title, copy]) => <li key={title}><h3>{title}</h3><p>{copy}</p></li>)}</ol></aside></div>
    <section className={s.more} aria-label="More ways to practise"><article><h2>Check your skills</h2>{assessment ? <><p><strong>{assessment.score} / 100</strong> · {assessment.title}</p><p>{assessment.basis} · {assessment.confidence} confidence · {assessment.date}</p><p>Scores describe this work, not your chances of getting hired.</p><Link href="/practice/readiness/results">View my results →</Link></> : <p>Answer workplace questions at your own pace.</p>}<Link href="/practice/readiness">{assessment ? "Try another skills check" : "Start a skills check"} →</Link></article><article><h2>Practise an interview</h2><p>A mock interview, with feedback on each answer.</p><Link href="/interview">Practise an answer →</Link></article><article><h2>Skills Passport</h2><p>Keep the work behind your skills together.</p><Link href="/passport">View my evidence →</Link></article></section>
  </main>;
}
