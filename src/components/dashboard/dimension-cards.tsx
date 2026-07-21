import type { DimensionStatus } from "@/lib/readiness-engine";
import type { DimensionCardData } from "@/lib/dashboard-data";

const STATUS_LABELS: Record<DimensionStatus, string> = {
  not_assessed: "Not Assessed",
  developing: "Developing",
  meets_standard: "Meets Standard",
  strong: "Strong",
  outdated: "Outdated",
};

// Exact mapping specified in docs/PLAYBOOK.md Session 8.
const STATUS_BADGE_CLASSES: Record<DimensionStatus, string> = {
  not_assessed: "bg-gray-200 text-gray-700",
  developing: "bg-amber-100 text-amber-800",
  meets_standard: "bg-green-100 text-green-800",
  strong: "bg-purple-100 text-purple-800",
  outdated: "bg-red-100 text-red-800",
};

interface DimensionCardsProps {
  cards: DimensionCardData[];
}

export function DimensionCards({ cards }: DimensionCardsProps) {
  return (
    <section className="flex flex-col gap-3">
      {cards.map((card) => (
        <div
          key={card.dimensionId}
          className="rounded-lg border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium text-gray-900">{card.name}</h2>
            <span
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[card.status]}`}
            >
              {STATUS_LABELS[card.status]}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>
              Score: {card.score !== null ? Math.round(card.score) : "—"}
            </span>
            <span>
              {card.evidenceCount}{" "}
              {card.evidenceCount === 1 ? "evidence item" : "evidence items"}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
