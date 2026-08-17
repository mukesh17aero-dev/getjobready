// When something happened, said the way a person in India reads it.
//
// The zone is fixed to IST and named on every stamp rather than left to the
// device. A resume built at 2am and a resume built at 2pm are different
// stories, and a bare date hides which. Naming the zone matters because the
// same record is read on a phone that may be set to anything at all - an
// unlabelled "8:27 am" is a small lie waiting to happen.

const IST = "Asia/Kolkata";

const stamp = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: IST,
  timeZoneName: "short",
});

/** "17 Aug 2026, 8:27 am IST" - empty string for anything unparseable. */
export function whenLabel(iso: string | undefined | null): string {
  if (!iso) return "";
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? "" : stamp.format(at);
}
