/**
 * Shown whenever an admin is looking at an area that is not their own.
 *
 * Deliberately loud and at the very top of the page. The one genuine danger of
 * a preview feature is an admin forgetting they are in it and reporting what
 * they see as a bug — or worse, believing an empty student dashboard is their
 * own. It must be impossible to miss.
 */
export function PreviewBar({
  area,
  exitAction,
}: {
  area: string;
  exitAction: () => Promise<void>;
}) {
  return (
    <div className="border-b border-amber-300 bg-amber-100">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-2.5 text-sm text-amber-900">
        <span>
          <strong className="font-semibold">Preview.</strong> You are an admin
          looking at the {area} view. This is not your own data.
        </span>
        <form action={exitAction}>
          <button
            type="submit"
            className="rounded-lg border border-amber-400 bg-white/70 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-white"
          >
            Back to admin
          </button>
        </form>
      </div>
    </div>
  );
}
