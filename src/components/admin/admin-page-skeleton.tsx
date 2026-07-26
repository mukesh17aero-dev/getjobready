// Fixed at 5 placeholders to match the current MVP's fixed dimension count
// (same convention as dimension-cards-skeleton.tsx) — revisit if dimensions
// ever become variable in count.
const PLACEHOLDER_COUNT = 5;

export function AdminPageSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="h-9 flex-1 rounded bg-gray-200" />
            <div className="h-9 w-24 rounded bg-gray-200" />
            <div className="h-9 w-16 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
