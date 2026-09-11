import { OneScreen } from "./one-screen";

// One screen per audience. Dead preview page.
//
// The decision: option three (a story per audience) crossed with option four
// (no scroll). So the switch stops changing a headline and starts changing
// the page, and each of the three pages is ONE screen carrying everything
// that used to be spread over two sheets - the common argument, the part
// written for that audience, and the ask.

export const metadata = { title: "Preview — one screen per audience" };

export default function Page() {
  return <OneScreen />;
}
