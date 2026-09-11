import { CourtyardFest } from "./courtyard-fest";
import { ScreenGuard } from "@/components/screen-guard";

export const metadata = { title: "Preview — Courtyard before the fest" };

export default function Page() {
  return (
    // In the real sitting this is the signed-in student's own name and email,
    // read from the session. Hard-coded here because a preview has no session —
    // and the mark is only a deterrent if it is genuinely theirs.
    <ScreenGuard
      identity="preview@ascend · not a real sitting"
      stamp={new Date().toISOString().slice(0, 16).replace("T", " ")}
    >
      <CourtyardFest />
    </ScreenGuard>
  );
}
