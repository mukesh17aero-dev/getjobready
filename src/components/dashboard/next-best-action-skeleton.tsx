export function NextBestActionSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-gray-200 p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="h-3 w-28 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
    </div>
  );
}
