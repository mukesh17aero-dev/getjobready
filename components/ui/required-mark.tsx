// The mark beside a label that says an answer is needed.
//
// The asterisk is decorative: screen readers would otherwise read "star", so
// it is hidden and the word "required" is given to them instead. The input
// itself still carries aria-required, which is what assistive technology
// actually acts on — this is the visible half of the same statement.

export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-0.5 font-bold text-rose-600">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

