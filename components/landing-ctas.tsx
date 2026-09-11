import Link from "next/link";
import { ArrowRight } from "@/components/icons";

const PRIMARY =
  "inline-flex items-center gap-2 rounded-xl bg-[var(--lp-cta-bg)] px-9 py-4 text-[1rem] font-bold text-[var(--lp-cta-ink)] shadow-[0_16px_44px_-12px_rgba(0,0,0,0.65)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_52px_-12px_rgba(45,212,191,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0";

// The landing's one button, and it never asks for an account.
//
// Nobody is made to sign up to look around: "/" is the home screen whether or
// not you are signed in, and the doors on it open. The account is asked for
// further in, at the point where a resume or an interview record has to belong
// to somebody - see GlimpseBanner. A signup wall here would be charging at the
// door for a room we are happy to let people stand in.
//
// Signing up is still one tap away in the sticky header on every page, for
// anyone who wants it. It is offered, not demanded.
//
// The ?auth= deep link used to be handled here; it is AuthDeepLink now, and
// the landing mounts it for every audience rather than only the ones whose
// page happens to end in this button.
export function LandingCtas({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="reveal-view mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
      <Link href={signedIn ? "/profile" : "/"} className={PRIMARY}>
        Begin your climb
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
