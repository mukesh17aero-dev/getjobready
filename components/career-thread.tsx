import type { Station } from "@/lib/next-step";
import { Check } from "@/components/icons";

// What Ascend has about this person, as one continuous line rather than a grid
// of features.
//
// The thread is the product's central claim made visible: nothing here is a
// separate tool you visit, it is one record that keeps growing. Teal is
// reserved throughout the app for things a person has earned, so a filled
// marker always means "you did this" and never "this exists".
//
// A station with nothing behind it stays empty. Showing a plausible-looking
// detail for a step that has not happened would be the fastest way to make the
// rest of the page untrustworthy.

export function CareerThread({ stations }: { stations: Station[] }) {
  const done = stations.filter((s) => s.done).length;

  return (
    <section aria-label="What Ascend knows about you">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">
          Your record so far
        </h2>
        <span className="text-[0.75rem] tabular-nums text-slate-400">
          {done} of {stations.length}
        </span>
      </div>

      <ol className="mt-3 grid gap-0">
        {stations.map((station, i) => {
          const last = i === stations.length - 1;
          return (
            <li key={station.id} className="flex gap-3.5">
              {/* Marker and the line to the next station. */}
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                    station.done
                      ? "border-brand-teal bg-brand-teal text-white"
                      : "border-slate-300 bg-surface text-transparent"
                  }`}
                >
                  <Check size={12} />
                </span>
                {!last && (
                  <span
                    aria-hidden
                    className={`w-0.5 flex-1 origin-top ${
                      station.done ? "animate-draw bg-brand-teal/45" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              <div className={last ? "pb-0" : "pb-4"}>
                <p
                  className={`text-[0.92rem] font-medium ${
                    station.done ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {station.label}
                </p>
                {station.detail && (
                  <p className="mt-0.5 text-[0.8rem] text-slate-500">
                    {station.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
