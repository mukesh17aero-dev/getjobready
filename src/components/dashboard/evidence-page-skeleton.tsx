const PLACEHOLDER_COUNT = 3;

export function EvidencePageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="animate-pulse rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-24 rounded-full bg-gray-200" />
        <div className="mt-3 h-3 w-full rounded bg-gray-200" />
        <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="mt-3 h-3 w-full rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
