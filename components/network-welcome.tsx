"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthDeepLink } from "@/components/auth-deep-link";
import { WelcomeAccountControls } from "@/components/app-header";
import { welcomeMarkup } from "./network-welcome-markup";
import "./network-welcome.css";

const markupWithAccount = welcomeMarkup.replace(/<a class="login"[^>]*>.*?<\/a>/, '<div class="welcome-account"></div>');
// Keep the HTML prop stable: replacing this DOM would detach the account portal.
const welcomeHtml = { __html: markupWithAccount };

export function NetworkWelcome({ audience }: { audience: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [accountSlot, setAccountSlot] = useState<HTMLElement | null>(null);
  const attachRoot = useCallback((node: HTMLDivElement | null) => {
    root.current = node;
    setAccountSlot(node?.querySelector<HTMLElement>(".welcome-account") ?? null);
  }, []);
  // The renderer owns this subtree. Account/session renders must not reset its DOM.
  const surface = useMemo(() => <div className="network-welcome" ref={attachRoot} dangerouslySetInnerHTML={welcomeHtml} />, [attachRoot]);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    // Live preview edits can replace the HTML without replacing the outer node.
    // Reattach both the account portal and animation controller to that new DOM.
    setAccountSlot(root.current?.querySelector<HTMLElement>(".welcome-account") ?? null);
    void import("./network-welcome-renderer.js").then(({ mountNetworkWelcome }) => {
      if (cancelled || !root.current) return;
      const selected = new URLSearchParams(window.location.search).get("for") ?? audience;
      dispose = mountNetworkWelcome(root.current, selected);
    });
    return () => { cancelled = true; dispose?.(); };
  }, [audience]);
  return <>{surface}{accountSlot && createPortal(<WelcomeAccountControls />, accountSlot)}<AuthDeepLink /></>;
}
