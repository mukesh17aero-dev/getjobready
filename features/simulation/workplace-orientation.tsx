"use client";

import { useRef, useState, type ReactNode } from "react";
import type { CourseIntroduction, LearningTask } from "./simulation-api";
import { youtubeEmbedUrl } from "@/components/ui/youtube-playback";
import { WorkplaceNarration } from "./workplace-narration";
import s from "./workplace-orientation.module.css";

type VideoResource = { videoId: string; title: string; startSeconds?: number; endSeconds?: number };
type Props = {
  roleTitle: string;
  sector?: string;
  introduction: Omit<CourseIntroduction, "video">;
  task?: LearningTask;
  video?: ReactNode;
  resources?: VideoResource[];
  onContinue: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  busy?: boolean;
};
const chapters = ["Your workplace", "Follow the work", "Watch an example", "Your first task"];

/** Presents published curriculum; it never invents role facts or awards readiness. */
export function WorkplaceOrientation({ roleTitle, sector, introduction: intro, task, video,
  resources = [], onContinue, onSkip, continueLabel = "Build my practice plan", busy = false }: Props) {
  const [chapter, setChapter] = useState(0);
  const [moment, setMoment] = useState(0);
  const [place, setPlace] = useState(0);
  const [watch, setWatch] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);
  const scenes = intro.lesson.illustration;
  const scene = scenes[place];
  const steps = intro.lesson.steps;
  const narration = chapter === 0
    ? `${roleTitle}. ${intro.objective} ${intro.lesson.explanation} ${scene ? `${scene.title}. ${scene.body}` : ""}`
    : chapter === 1 ? `${steps[moment] ?? intro.objective}. ${intro.responsibilities.join(". ")}`
    : chapter === 2 ? intro.lesson.workedExample
    : task ? `${task.title}. ${task.brief}. Your work to produce: ${task.deliverable}` : intro.objective;

  function openChapter(index: number) {
    setChapter(index);
    setWatch(null);
    requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
  }

  return <section className={s.experience} aria-label={`${roleTitle} workplace introduction`}>
    <header className={s.hero}>
      <div><span className={s.eyebrow}>{sector || "Explore the workplace"} · Role orientation</span>
        <h2>Before your first task,<br />step into the role.</h2>
        <p>See how the work fits together, watch an example, then take your first turn with support.</p>
        <div className={s.roleBadge}><span aria-hidden="true">↳</span> {roleTitle}</div>
      </div>
      <div className={s.route} aria-label="Your path through the experience">
        <span>Understand the workplace</span><i aria-hidden="true">↓</i>
        <span>See the work in action</span><i aria-hidden="true">↓</i>
        <span>Try it with guidance</span>
      </div>
    </header>
    <nav className={s.chapters} aria-label="Workplace introduction chapters">
      {chapters.map((label, index) => <button type="button" key={label} onClick={() => openChapter(index)}
        aria-current={chapter === index ? "step" : undefined}>
        <span>{String(index + 1).padStart(2, "0")}</span>{label}
      </button>)}
    </nav>
    <section ref={panel} tabIndex={-1} className={s.panel} aria-label={chapters[chapter]}>
      <div className={s.chapterHeading}><div><span className={s.eyebrow}>Chapter {chapter + 1} of 4</span>
        <h3>{chapters[chapter]}</h3></div>
        <WorkplaceNarration key={`${chapter}:${moment}:${place}`} text={narration} />
      </div>
      {chapter === 0 && <>
        <p className={s.lead}>{intro.objective}</p>
        <div className={s.ecosystem}>
          <div className={s.roleNode}><span>Your place in this workplace</span><strong>{roleTitle}</strong>
            <p>{intro.title}</p><span aria-hidden="true">↓</span></div>
          {scenes.length > 0 && <div className={s.mapNodes} aria-label="Explore the role's working context">
            {scenes.map((item, index) => <button type="button" key={`${index}:${item.title}`} onClick={() => setPlace(index)}
              aria-pressed={place === index} aria-controls="workplace-scene">
              <span className={s.nodeIcon} aria-hidden="true">{["◎", "⇄", "▤", "◇"][index % 4]}</span>
              <strong>{item.title}</strong><small>Explore this part →</small>
            </button>)}
          </div>}
          {scene && <article id="workplace-scene" className={s.scene} aria-live="polite"><span className={s.eyebrow}>Inside the workplace</span><h4>{scene.title}</h4><p>{scene.body}</p></article>}
        </div>
        <details className={s.guide}><summary>Guide: how does this role fit into the bigger picture?</summary><p>{intro.lesson.explanation}</p></details>
      </>}
      {chapter === 1 && <>
        <p className={s.lead}>Walk through the approach used in this role. Select a moment to slow it down.</p>
        <div className={s.day}>
          <nav aria-label="Steps in the work" className={s.timeline}>
            {steps.map((step, index) => <button type="button" key={`${index}:${step}`} aria-pressed={moment === index} onClick={() => setMoment(index)}>
              <span>{index + 1}</span><strong>{step}</strong>
            </button>)}
          </nav>
          <article className={s.desk} aria-live="polite"><div className={s.deskBar}><i /><i /><i /><span>Workplace walkthrough</span></div>
            <div><span className={s.eyebrow}>Focus {moment + 1}</span><h4>{steps[moment] || intro.title}</h4>
              <p>{intro.lesson.workedExample}</p><small>Illustrative worked example · actual routines vary by employer</small></div>
          </article>
        </div>
        <details className={s.guide}><summary>Guide: what would I be responsible for?</summary><ul>{intro.responsibilities.map((item, index) => <li key={index}>{item}</li>)}</ul></details>
      </>}
      {chapter === 2 && <>
        <p className={s.lead}>Watch or read the example before you’re asked to produce your own work.</p>
        {video && <div className={s.media}>{video}</div>}
        <article className={s.example}><span className={s.eyebrow}>A moment in the role</span><h4>{intro.title}</h4><p>{intro.lesson.workedExample}</p></article>
        {resources.length > 0 && <section className={s.resources}><h4>Watch the work from another angle</h4><p>Optional videos from this role’s published curriculum. Playback loads only when you choose a video.</p>
          {resources.filter(item => youtubeEmbedUrl(item)).slice(0, 3).map(item => <article key={item.videoId}>
            {watch === item.videoId ? <iframe title={item.title} src={youtubeEmbedUrl(item)} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
              : <button type="button" onClick={() => setWatch(item.videoId)}><span aria-hidden="true">▷</span><strong>{item.title}</strong><span>Play video</span></button>}
          </article>)}
        </section>}
        <details className={s.guide}><summary>Guide: what should I pay attention to?</summary><ul>{intro.lesson.commonMistakes.map((item, index) => <li key={index}>{item}</li>)}</ul></details>
      </>}
      {chapter === 3 && <>
        <p className={s.lead}>You don’t need to know everything yet. Here’s the situation you’ll work through with guidance.</p>
        {task ? <>
          <article className={s.assignment}><span className={s.eyebrow}>Your first guided assignment</span><h4>{task.title}</h4><p>{task.brief}</p>
            <div><strong>What you’ll produce</strong><p>{task.deliverable}</p></div>
          </article>
          <div className={s.references}>{task.cards.map((card, index) => <details key={index}><summary><span aria-hidden="true">▤ </span>{card.title}</summary><p>{card.body}</p></details>)}</div>
          {task.hint && <details className={s.guide}><summary>Guide: where would I start?</summary><p>{task.hint}</p></details>}
        </> : <article className={s.example}><h4>Your responsibilities</h4><ul>{intro.responsibilities.map((item, index) => <li key={index}>{item}</li>)}</ul></article>}
        <p className={s.note}>Exploring this introduction is learning, not an assessment. Your work and feedback come next.</p>
      </>}
    </section>
    <footer className={s.footer}>
      <div>{onSkip && <button type="button" className={s.quiet} onClick={onSkip} disabled={busy}>I know the role · go to my plan</button>}
        {!onSkip && chapter > 0 && <button type="button" className={s.quiet} onClick={() => openChapter(chapter - 1)}>← Previous chapter</button>}</div>
      {chapter < chapters.length - 1
        ? <button type="button" className={s.primary} onClick={() => openChapter(chapter + 1)}>{chapters[chapter + 1]} →</button>
        : <button type="button" className={s.primary} onClick={onContinue} disabled={busy}>{busy ? "Saving…" : continueLabel} →</button>}
    </footer>
  </section>;
}
