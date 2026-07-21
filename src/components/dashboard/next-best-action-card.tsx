import type { RecommendationData } from "@/lib/dashboard-data";

interface NextBestActionCardProps {
  recommendation: RecommendationData | null;
}

// Extensible by design: reasoning/confidence/estimatedImpact/
// estimatedCompletionMinutes on RecommendationData are optional and only
// rendered when present, so a future AI-generated layer can populate them
// without changing this component's shape.
export function NextBestActionCard({ recommendation }: NextBestActionCardProps) {
  if (!recommendation) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500">Next Best Action</h2>
        <p className="mt-2 text-sm text-gray-600">
          Nothing open right now — you&apos;re on track. New actions will
          appear here as you complete assessments.
        </p>
      </div>
    );
  }

  const {
    actionText,
    actionLink,
    dimensionName,
    reasoning,
    confidence,
    estimatedImpact,
    estimatedCompletionMinutes,
  } = recommendation;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-purple-700">Next Best Action</h2>
      {dimensionName && (
        <p className="mt-1 text-xs text-purple-500">{dimensionName}</p>
      )}
      <p className="mt-2 text-sm text-gray-900">{actionText}</p>
      {reasoning && <p className="mt-2 text-sm text-gray-600">{reasoning}</p>}
      {(confidence !== undefined ||
        estimatedImpact !== undefined ||
        estimatedCompletionMinutes !== undefined) && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
          {confidence !== undefined && <span>Confidence: {confidence}%</span>}
          {estimatedImpact !== undefined && <span>Impact: {estimatedImpact}</span>}
          {estimatedCompletionMinutes !== undefined && (
            <span>~{estimatedCompletionMinutes} min</span>
          )}
        </div>
      )}
      {actionLink && (
        <a
          href={actionLink}
          className="mt-3 inline-block text-sm font-semibold text-purple-700 underline"
        >
          Take action
        </a>
      )}
    </div>
  );
}
