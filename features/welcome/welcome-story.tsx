"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AUDIENCES, audienceConfig, type Audience } from "./hero/config";
import s from "./welcome-story.module.css";

// "What is Ascend?": the one-minute film and the three connections, the one
// for the selected audience lit. The section below the hero, kept as it was
// and driven by the same audience state.

export type WelcomeStoryHandle = { watch: () => void };

export const WelcomeStory = forwardRef<WelcomeStoryHandle, { audience: Audience }>(
  function WelcomeStory({ audience }, ref) {
    const section = useRef<HTMLElement>(null);
    const film = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
      const video = film.current;
      if (!video) return;
      const sync = () => setPlaying(!video.paused);
      video.addEventListener("play", sync);
      video.addEventListener("pause", sync);
      video.addEventListener("ended", sync);
      return () => {
        video.removeEventListener("play", sync);
        video.removeEventListener("pause", sync);
        video.removeEventListener("ended", sync);
      };
    }, []);

    // "Watch how it works" in the hero: bring the film into view and start it.
    useImperativeHandle(ref, () => ({
      watch: () => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        section.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        window.history.replaceState(null, "", "#what-is-ascend");
        void film.current?.play().catch(() => {});
      },
    }));

    return (
      <div className={s.root}>
        <section ref={section} className={s.about} id="what-is-ascend" aria-labelledby="about-title">
          <div className={s.intro}>
            <div>
              <p className={s.eyebrow}>WHAT IS ASCEND?</p>
              <h2 id="about-title">
                An AI-native
                <br />
                <em>talent fulfillment network.</em>
              </h2>
            </div>
            <p>
              <strong className={s.gapHeading}>
                Bridging the gap between getting hired and becoming productive.
              </strong>
              Ascend connects students, colleges and employers through role discovery, preparation
              and evidence of capability, helping people become productive sooner.
            </p>
          </div>
          <figure className={s.film} aria-labelledby="welcome-story-title">
            <figcaption>
              <p className={s.eyebrow}>ASCEND IN 60 SECONDS</p>
              <h3 id="welcome-story-title">From potential to productive work.</h3>
            </figcaption>
            <div className={s.player} data-playing={playing}>
              <video
                ref={film}
                controls
                playsInline
                preload="none"
                poster="/welcome/ascend-one-minute-poster.jpg"
                aria-label="What Ascend means for students, colleges and employers"
              >
                <source src="/welcome/ascend-one-minute-v3.mp4" type="video/mp4" />
                <track kind="captions" src="/welcome/ascend-one-minute.vtt" srcLang="en" label="English" default />
              </video>
              <button
                className={s.play}
                type="button"
                aria-label="Play: Ascend in 60 seconds"
                onClick={() => void film.current?.play().catch(() => {})}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </figure>
          <div className={s.connections}>
            {AUDIENCES.map((id) => (
              <article key={id} className={s.connection} data-active={id === audience}>
                <h3>{audienceConfig[id].story.title}</h3>
                <p>{audienceConfig[id].story.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  },
);
