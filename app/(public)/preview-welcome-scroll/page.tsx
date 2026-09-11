import { LongScroll } from "./long-scroll";

// One long scroll, ask at the end. Dead preview page.
//
// The other direction from the one-screen preview, and the one that stops
// squeezing anything: the two exhibits keep their full size, the page just
// gets longer. What makes it work is that the ask is in two places at once -
// a slim bar that appears the moment the hero leaves the screen, for anybody
// already sold, and the full ask at the bottom for anybody who read.

export const metadata = { title: "Preview — one long scroll" };

export default function Page() {
  return <LongScroll />;
}
