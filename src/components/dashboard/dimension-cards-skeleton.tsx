// Fixed at 5 placeholders to match the current MVP's fixed dimension count
// (see docs/DATABASE_SCHEMA.md seed data) — revisit if dimensions ever
// become per-student variable.
const PLACEHOLDER_COUNT = 5;

export function DimensionCardsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-5 w-20 rounded-full bg-gray-200" />
          </div>
          <div className="mt-3 flex justify-between">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
