export function PriDialSkeleton() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-2" aria-hidden="true">
      <div className="h-[100px] w-full max-w-xs rounded-t-full bg-gray-200" />
      <div className="h-3 w-24 rounded bg-gray-200" />
    </div>
  );
}
