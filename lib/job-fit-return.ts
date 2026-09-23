/** Only this local destination can be used after editing a profile for a job. */
export function jobFitReturn(value: string | null): string | null {
  if (!value || value.length > 1000) return null;
  return value === "/job-fit" || value.startsWith("/job-fit?") ? value : null;
}
