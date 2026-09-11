import { Rail } from "./rail";

// "Your story so far", as a rail on the home page. Dead preview page.
//
// The home page says what to do next and what the doors are. What it never
// says is what you have already done - so somebody who spent forty minutes
// here last week arrives to a screen that looks exactly like the one a
// stranger sees, minus a bar that moved.
//
// Three ways to put the record on the page, at true size.

export const metadata = { title: "Preview — your story rail" };

export default function Page() {
  return <Rail />;
}
