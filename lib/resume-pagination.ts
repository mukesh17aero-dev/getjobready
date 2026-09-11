/** UI pagination over the saved versions, already ordered newest first. */
export function resumePage<T>(entries: readonly T[], requestedPage: number) {
  const pageSize = 5;
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const page = Math.min(Math.max(0, Math.floor(requestedPage)), pages - 1);
  const start = page * pageSize;
  return { entries: entries.slice(start, start + pageSize), page, pages, start };
}
