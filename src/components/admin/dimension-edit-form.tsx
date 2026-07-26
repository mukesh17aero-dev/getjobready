import { updateDimension } from "@/app/admin/actions";
import type { AdminDimensionData } from "@/lib/admin-data";

interface DimensionEditFormProps {
  dimension: AdminDimensionData;
}

// Plain form bound directly to a Server Action — no client JS needed here,
// same pattern already used for logout (<form action="/auth/signout">).
// Validation errors surface via a redirect back to /admin?error=... (see
// actions.ts), rendered by the page, not by this component.
export function DimensionEditForm({ dimension }: DimensionEditFormProps) {
  const nameId = `name-${dimension.dimensionId}`;
  const weightId = `weight-${dimension.dimensionId}`;
  const activeId = `active-${dimension.dimensionId}`;

  return (
    <form
      action={updateDimension}
      className="rounded-lg border border-gray-200 p-4 shadow-sm"
    >
      <input type="hidden" name="dimensionId" value={dimension.dimensionId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={nameId} className="text-xs font-medium text-gray-500">
            Name
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            required
            defaultValue={dimension.name}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
          />
        </div>
        <div className="w-full sm:w-28">
          <label htmlFor={weightId} className="text-xs font-medium text-gray-500">
            Weight
          </label>
          <input
            id={weightId}
            name="weight"
            type="number"
            step="0.1"
            min="0.1"
            required
            defaultValue={dimension.weight}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
          />
        </div>
        <div className="flex items-center gap-2 sm:pb-2">
          <input
            id={activeId}
            name="active"
            type="checkbox"
            defaultChecked={dimension.active}
            className="h-4 w-4"
          />
          <label htmlFor={activeId} className="text-sm text-gray-700">
            Active
          </label>
        </div>
        <button
          type="submit"
          className="rounded bg-purple-700 px-4 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-900 sm:mb-0"
        >
          Save
        </button>
      </div>
    </form>
  );
}
