"use client";

import { useRef, useState } from "react";
import { AuthDeepLink } from "@/components/auth/auth-deep-link";
import { WelcomeHero } from "./hero/welcome-hero";
import { AUDIENCES, type Audience } from "./hero/config";
import { WelcomeStory, type WelcomeStoryHandle } from "./welcome-story";

// The welcome page: one audience state shared by the hero above and the
// story below. The URL carries it as ?for=, read on the server for the first
// paint and kept up to date here without a reload, so a link in a deck lands
// on the right tab and the tab someone picks survives a refresh.

export function WelcomePage({ initial }: { initial: Audience }) {
  const [audience, setAudience] = useState<Audience>(initial);
  const story = useRef<WelcomeStoryHandle>(null);

  const change = (next: Audience) => {
    if (!AUDIENCES.includes(next) || next === audience) return;
    setAudience(next);
    const url = new URL(window.location.href);
    url.searchParams.set("for", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <main>
      <WelcomeHero
        audience={audience}
        initial={initial}
        onChange={change}
        onWatch={() => story.current?.watch()}
      />
      <WelcomeStory ref={story} audience={audience} />
      <AuthDeepLink />
    </main>
  );
}
