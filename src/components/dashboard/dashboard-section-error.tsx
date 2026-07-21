interface DashboardSectionErrorProps {
  message: string;
}

// Shared friendly-error presentation for a dashboard section that failed to
// load. Deliberately distinct in tone and markup from a legitimate empty
// state (e.g. "no recommendations yet") so the two are never confused.
export function DashboardSectionError({ message }: DashboardSectionErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {message}
    </div>
  );
}
