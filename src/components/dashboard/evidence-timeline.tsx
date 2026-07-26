"use client";

import { useMemo, useState } from "react";
import type { EvidenceDetailItem } from "@/lib/dashboard-data";

type SortOrder = "newest" | "oldest" | "highest" | "lowest";

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest",
  oldest: "Oldest",
  highest: "Highest Score",
  lowest: "Lowest Score",
};

function sortItems(items: EvidenceDetailItem[], order: SortOrder): EvidenceDetailItem[] {
  const sorted = [...items];
  switch (order) {
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
      );
    case "highest":
      return sorted.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
    case "lowest":
      return sorted.sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity));
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
      );
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface EvidenceTimelineProps {
  items: EvidenceDetailItem[];
}

// The list arrives already sorted newest-first from the server; sorting here
// is purely a client-side re-order of that same array (no refetch).
export function EvidenceTimeline({ items }: EvidenceTimelineProps) {
  const [order, setOrder] = useState<SortOrder>("newest");
  const sorted = useMemo(() => sortItems(items, order), [items, order]);

  return (
    <section aria-labelledby="evidence-timeline-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="evidence-timeline-heading" className="font-medium text-gray-900">
          Evidence Timeline
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="evidence-sort" className="text-xs text-gray-500">
            Sort by
          </label>
          <select
            id="evidence-sort"
            value={order}
            onChange={(event) => setOrder(event.target.value as SortOrder)}
            className="rounded border border-gray-300 px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
          >
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {sorted.map((item) => (
          <li
            key={item.evidenceId}
            className={`rounded-lg border p-4 shadow-sm ${
              item.isValid ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-900">{item.summary}</h3>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.isValid
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {item.isValid ? "Valid" : "Expired"}
              </span>
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-3">
              <div>
                <dt className="text-gray-400">Source</dt>
                <dd className="capitalize">{item.source}</dd>
              </div>
              {item.evidenceType && (
                <div>
                  <dt className="text-gray-400">Assessment</dt>
                  <dd className="capitalize">{item.evidenceType.replace(/_/g, " ")}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-400">Score</dt>
                <dd>
                  {item.score !== null ? Math.round(item.score) : "—"}
                  {item.maxScore !== null ? ` / ${item.maxScore}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Date</dt>
                <dd>{formatDate(item.assessmentDate)}</dd>
              </div>
              {item.expiryDate && (
                <div>
                  <dt className="text-gray-400">{item.isValid ? "Expires" : "Expired on"}</dt>
                  <dd>{formatDate(item.expiryDate)}</dd>
                </div>
              )}
            </dl>

            {item.aiExplanation && (
              <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
                <p className="text-gray-700">{item.aiExplanation.studentSummary}</p>
                {item.aiExplanation.strengths.length > 0 && (
                  <p className="mt-1">
                    <span className="font-medium text-green-700">Strengths: </span>
                    {item.aiExplanation.strengths.join(", ")}
                  </p>
                )}
                {item.aiExplanation.gaps.length > 0 && (
                  <p className="mt-1">
                    <span className="font-medium text-amber-700">Gaps: </span>
                    {item.aiExplanation.gaps.join(", ")}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
