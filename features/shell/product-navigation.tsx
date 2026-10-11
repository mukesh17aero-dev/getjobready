"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useExclusivePanel } from "@/components/ui/use-exclusive-panel";
import { BrandLogo } from "@/components/ui/brand-logo";
import s from "./product-navigation.module.css";

// Each area, and the pages inside it - shown beneath it in the open rail so
// a page is one press away rather than behind the area's own landing page.
type Destination = { label: string; href: string; paths: string[]; icon: string; pages?: Array<{ label: string; href: string; also?: string[] }> };
const destinations: Destination[] = [
  { label: "Home", href: "/", paths: ["/", "/start"], icon: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z" },
  { label: "Explore", href: "/discover", paths: ["/discover"], icon: "m16 8-3 5-5 3 3-5Z M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" },
  { label: "Practice", href: "/practice", paths: ["/practice", "/interview", "/roleplay"], icon: "m7 3 14 9-14 9Z",
    pages: [{ label: "Readiness check", href: "/practice/readiness" }, { label: "Simulations", href: "/practice/missions" }, { label: "AI interview", href: "/interview/practice" }, { label: "Roleplay", href: "/roleplay" }, { label: "Interview questions", href: "/interview/questions" }] },
  { label: "Apply", href: "/resume", paths: ["/resume", "/job-fit", "/profile/professional"], icon: "M5 2h9l5 5v15H5Z M14 2v6h5 M9 12h6 M9 16h6",
        // One Resume entry: the builder, which links to the saved ones - and stays current on either.
    pages: [{ label: "Resume", href: "/resume/build", also: ["/resume/saved"] }, { label: "LinkedIn profile", href: "/profile/professional" }, { label: "Job fit", href: "/job-fit" }] },
  { label: "Jobs", href: "/opportunities", paths: ["/opportunities"], icon: "M3 7h18v14H3Z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3" },
];

const inArea = (pathname: string, paths: string[]) => paths.some(path => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
// A page is current at its own path or anywhere under it; its query never counts.
const onPage = (pathname: string, href: string) => { const path = href.split("?")[0]!; return !href.includes("?") && (pathname === path || pathname.startsWith(`${path}/`)); };

const utilities = [
  { label: "Saved roles", href: "/discover?saved=1", icon: "M6 3h12v18l-6-4-6 4Z" },
  { label: "Skills Passport", href: "/passport", icon: "M5 3h14v18H5Z M9 7h6 M9 11h6 M9 15h3" },
  { label: "My profile", href: "/profile", icon: "M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
];

export function ProductNavigation({ pathname, account }: { pathname: string; account?: ReactNode }) {
  const owner = useId();
  const sidebarRef = useRef<HTMLElement>(null);
  const keyboardFocus = useRef(false);
  const { open, activate, dismiss } = useExclusivePanel(owner);
  // Which areas show their pages: the one they are in, unless closed; any
  // other they open with its chevron.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const pagesId = useId();
  // A route change must not keep the rail open just because its link retains focus.
  useEffect(() => {
    keyboardFocus.current = false;
    if (!sidebarRef.current?.matches(":hover")) dismiss();
  }, [pathname, dismiss]);

  return <aside ref={sidebarRef} className={s.sidebar} data-product-sidebar data-expanded={open}
    onPointerEnter={event => { if (event.pointerType === "mouse") activate(); }}
    onPointerDownCapture={() => { keyboardFocus.current = false; }}
    onKeyDownCapture={() => { keyboardFocus.current = true; }}
    onPointerLeave={event => {
      const hasKeyboardFocus = keyboardFocus.current && event.currentTarget.contains(document.activeElement);
      const menuOpen = event.currentTarget.querySelector('[aria-haspopup="menu"][aria-expanded="true"]');
      if (!hasKeyboardFocus && !menuOpen) dismiss();
    }}
    onFocusCapture={event => {
      keyboardFocus.current = event.target.matches(":focus-visible");
      activate();
    }}
    onClickCapture={event => {
      if ((event.target as HTMLElement).closest("a[href]")) {
        // Covers same-page and query-only links as well as pathname changes.
        keyboardFocus.current = false;
        if (!event.currentTarget.matches(":hover")) { dismiss(); return; }
      }
      activate();
    }}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(":hover")) dismiss();
    }}
  >
    <Link href="/welcome" className={s.brand} aria-label="Ascend welcome"><BrandLogo size={30} /><span>ascend</span></Link>
    <nav aria-label="Main navigation" className={s.destinations}>
      {destinations.map((item, index) => {
        const current = inArea(pathname, item.paths);
        const shown = Boolean(item.pages) && (toggled[item.href] ?? current);
        const listId = `${pagesId}-${index}`;
        return <div key={item.href} className={s.area} data-open={shown || undefined}>
          <div className={s.areaRow}>
            <Link href={item.href} aria-label={item.label} title={item.label} aria-current={current ? "page" : undefined}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={item.icon} /></svg><span>{item.label}</span>
            </Link>
            {item.pages && <button type="button" className={s.toggle} aria-expanded={shown} aria-controls={listId} aria-label={`${shown ? "Hide" : "Show"} ${item.label} pages`} onClick={() => setToggled(all => ({ ...all, [item.href]: !shown }))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>}
          </div>
          {item.pages && <ul id={listId} className={s.pages} hidden={!shown}>
            {item.pages.map(page => <li key={page.href}><Link href={page.href} aria-current={[page.href, ...(page.also ?? [])].some(href => onPage(pathname, href)) ? "page" : undefined}>{page.label}</Link></li>)}
          </ul>}
        </div>;
      })}
    </nav>
    <nav aria-label="Your space" className={s.utilities}>
      <p>Your space</p>
      {utilities.map(item => <Link key={item.href} href={item.href} aria-label={item.label} title={item.label} aria-current={pathname === item.href ? "page" : undefined}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={item.icon} /></svg><span>{item.label}</span>
      </Link>)}
    </nav>
    <div className={s.note}><strong>Small steps count.</strong><p>Pick one thing to try when you have time.</p></div>
    <div className={s.account}>{account}</div>
  </aside>;
}
