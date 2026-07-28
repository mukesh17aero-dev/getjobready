// Shared result type for every module's read path. Data functions return a
// DataResult instead of throwing, so a query failure can render a friendly,
// distinguishable error state instead of silently looking like "no data yet"
// (see docs/PROJECT_CONTEXT.md, Session 8 RLS incident).
//
// Lives in lib/ rather than in one module because the Readiness, Evidence and
// Role Standards modules all return it — a type shared by several modules
// belongs to neither of them.
export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };
