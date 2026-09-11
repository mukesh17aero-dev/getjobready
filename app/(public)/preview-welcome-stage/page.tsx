import { Stage } from "./stage";

// Two sheets in one window. Dead preview page.
//
// The two things worth keeping from the sheets being deleted are both
// PICTURES: the talent fulfillment network loop, and the employer chart with
// the funnel above it. Pictures are what a single screen can hold two of,
// because a picture is understood in a glance and prose is not - swap a
// paragraph under somebody's eyes and you have taken the sentence they were
// mid-way through; swap a diagram and they look at the new diagram.
//
// So the rule every option below obeys: THE WORDS NEVER MOVE. The headline,
// the sentence under it and the button are fixed. Only the stage changes.

export const metadata = { title: "Preview — two sheets, one window" };

export default function Page() {
  return <Stage />;
}
