import Link from "next/link";
import type { CareerProfile, JourneyState, HomeWorkItem } from "@/lib/api";
import { progressOf } from "@/lib/next-step";
import { toFields } from "@/lib/profile";
import { storySoFar } from "@/lib/stages";
import { pickupReason } from "@/lib/home-presentation";
import { Avatar } from "@/components/avatar";
import { ArrowRight, Check, Spark, Mic, Eye } from "@/components/icons";
import styles from "./preview.module.css";

// These illustrations describe the tools; they are not scores or activity charts.
function Illustration({ kind }: { kind: "explore" | "practice" | "interview" | "apply" }) {
  return <svg className={styles.illustration} aria-hidden="true" viewBox="0 0 150 112" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === "explore" ? <>
      <circle cx="82" cy="54" r="39" opacity=".15" /><circle cx="82" cy="54" r="27" opacity=".25" />
      <path d="m82 26 8 20 21 8-21 8-8 21-8-21-20-8 20-8z" fill="currentColor" fillOpacity=".1" />
      <circle cx="82" cy="54" r="4" fill="currentColor" /><circle cx="115" cy="24" r="4" fill="currentColor" fillOpacity=".3" stroke="none" />
      <path d="M32 76h12M38 70v12" opacity=".4" />
    </> : kind === "practice" ? <>
      <rect x="54" y="17" width="64" height="77" rx="10" transform="rotate(10 54 17)" opacity=".2" />
      <rect x="39" y="19" width="64" height="77" rx="10" fill="currentColor" fillOpacity=".05" />
      <path d="m51 39 4 4 7-8m-11 23 4 4 7-8m-11 23 4 4 7-8M71 39h18M71 58h18M71 77h13" />
    </> : kind === "interview" ? <>
      <rect x="48" y="14" width="40" height="59" rx="20" fill="currentColor" fillOpacity=".06" />
      <path d="M38 56a30 30 0 0 0 60 0M68 86v13M55 99h26M59 32h18M59 42h18" />
      <path d="M111 40v16m8-23v30m8-19v8M25 42v12M17 36v24" opacity=".3" />
    </> : <>
      <rect x="55" y="13" width="62" height="79" rx="8" transform="rotate(10 55 13)" opacity=".2" />
      <rect x="36" y="16" width="62" height="81" rx="8" fill="currentColor" fillOpacity=".05" />
      <circle cx="54" cy="36" r="7" /><path d="M69 32h16M69 40h11M49 56h35M49 65h35M49 74h22" />
      <circle cx="103" cy="81" r="15" fill="var(--preview-surface)" /><path d="m97 81 4 4 8-9" />
    </>}
  </svg>;
}

function workStatus(item: HomeWorkItem) {
  return item.status === "follow_up" ? "Completed · follow-up" : item.status === "in_review" ? "In review" : "In progress";
}

export function HomePreview({ state, profile, fallbackName, photo }: {
  state: JourneyState | null; profile: CareerProfile | null; fallbackName: string; photo?: string;
}) {
  if (!state) return <main className={styles.home}><h1>Your workspace is here.</h1><p>We couldn’t load your saved activity.</p><Link className={styles.primary} href="/preview-home-focus">Try again <ArrowRight size={16} /></Link></main>;
  const fields = toFields(profile);
  const name = progressOf(state).name || fields.fullName || fallbackName;
  const firstName = name.split(" ")[0];
  const story = storySoFar(state, fields);
  const work = state.work?.slice(0, 5);
  const interview = state.work?.find(item => item.title.startsWith("Interview"));
  const practice = state.work?.find(item => item.action.href.startsWith("/practice"));
  const application = state.work?.find(item => /^(LinkedIn|Resume|Job fit)/.test(item.title));
  const role = state.progress?.role?.title;
  const cards = [
    { kind: "explore" as const, title: "Explore the role", description: "Get a feel for the working day.", href: "/discover", icon: Eye, detail: role ? "Your chosen role is saved" : "Find a direction that feels right", earned: Boolean(role), footer: "Explore roles" },
    { kind: "practice" as const, title: "Role readiness", description: "Build confidence through real tasks.", href: "/practice", icon: Check, detail: practice ? workStatus(practice) : "Real situations. Useful feedback.", earned: practice?.status === "follow_up", footer: "Open practice" },
    { kind: "interview" as const, title: "Interview readiness", description: "Find your words. Make them count.", href: "/interview", icon: Mic, detail: interview?.status === "follow_up" ? "Interview completed · feedback ready" : interview ? workStatus(interview) : "A space to practise your answers", earned: interview?.status === "follow_up", footer: "Open interviews" },
    { kind: "apply" as const, title: "Professional Presence", description: "Turn your experience into your story.", href: "/resume", icon: Spark, detail: application ? `${application.title.split(" · ")[0]} · ${application.status === "in_review" ? "in review" : application.status === "follow_up" ? "follow-up available" : "in progress"}` : "Resume, LinkedIn and job fit", earned: false, footer: "Open applications" },
  ];

  return <main className={styles.home}>
    <header className={styles.hero}>
      <div className={styles.welcome}>
        <Link href="/profile" className={styles.avatarLink} aria-label="Open your profile"><Avatar src={photo} name={name} className={styles.avatar} /></Link>
        <div><span className={styles.eyebrow}>YOUR CAREER, IN THE MAKING</span><h1>{firstName ? <>Welcome back,<br /><strong>{firstName}.</strong></> : <>Your next chapter<br /><strong>starts here.</strong></>}</h1><p>A little clarity. A useful next step.</p></div>
      </div>
      <section className={styles.story} aria-labelledby="story-heading">
        <div className={styles.storyLabel}><span className={styles.storyMark}><Spark size={16} /></span><h2 id="story-heading">Your story so far</h2><Link href="/profile">Edit profile <ArrowRight size={13} /></Link></div>
        <p>{story.who ?? "Add a little about your background and interests to start your story. You can explore roles at any time."}</p>
      </section>
    </header>

    <div className={styles.columns}>
      <section className={styles.workspace} aria-labelledby="workspace-heading">
        <div className={styles.sectionHeading}><div><h2 id="workspace-heading">Your workspace</h2><p>Four ways to move your career forward.</p></div><span className={styles.sectionNumber}>01 — 04</span></div>
        <div className={styles.cards}>{cards.map(card => <Link href={card.href} key={card.kind} className={styles.card} data-kind={card.kind}>
          <div className={styles.cardTop}><span className={styles.icon}><card.icon size={20} /></span><Illustration kind={card.kind} /></div>
          <h3>{card.title}</h3><p>{card.description}</p>
          <div className={styles.cardStatus} data-earned={card.earned}>{card.earned ? <Check size={13} /> : <span className={styles.statusDot} />}{card.detail}</div>
          <div className={styles.cardFooter}><span>{card.footer}</span><span className={styles.arrow}><ArrowRight size={17} /></span></div>
        </Link>)}</div>
        <div className={styles.journey}><span className={styles.journeyIcon}><Spark size={19} /></span><div><strong>Every step adds to your story.</strong><p>Your choices, practice and saved work, together.</p></div><Link href="/journey">View journey <ArrowRight size={15} /></Link></div>
      </section>

      <section className={styles.pickup} aria-labelledby="pickup-heading">
        <div className={styles.sectionHeading}><div><h2 id="pickup-heading">Pick up your work</h2><p>Your latest open work and useful follow-ups.</p></div>{work && <span className={styles.count}>{work.length}</span>}</div>
        {work == null ? <div className={styles.empty}><h3>Saved work is unavailable</h3><p>We couldn’t check your latest records.</p><Link href="/preview-home-focus">Try again <ArrowRight size={15} /></Link></div>
          : work.length === 0 ? <div className={styles.empty}><Spark size={28} /><h3>Room for your next step</h3><p>Explore a role or open a workspace. Your open drafts and recommended follow-ups will appear here.</p><Link href="/discover">Explore roles <ArrowRight size={15} /></Link></div>
          : <ol className={styles.workList}>{work.map((item, index) => <li key={item.id} className={styles.workItem} data-featured={index === 0}>
            <div className={styles.workMeta}><span className={styles.badge} data-completed={item.status === "follow_up"}>{item.status === "follow_up" && <Check size={12} />}{workStatus(item)}</span>{index === 0 && <span className={styles.latest}>LATEST OPEN WORK</span>}</div>
            <h3>{item.title}</h3>
            <p className={styles.reason}><strong>Why pick this up: </strong>{pickupReason(item.reason)}</p>
            <Link href={item.action.href} className={index === 0 ? styles.primary : styles.workLink}>{item.action.label}<ArrowRight size={16} /></Link>
          </li>)}</ol>}
        <p className={styles.pickupNote}>Up to five items. Completed work returns only with a recommended next step.</p>
      </section>
    </div>
  </main>;
}
