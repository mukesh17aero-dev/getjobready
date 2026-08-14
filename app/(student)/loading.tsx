// Shown instantly while a student route renders on the server, so navigation
// never looks frozen. Mirrors the page rhythm rather than a spinner.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-7 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </main>
  );
}
