# lib/ — shared platform helpers

Cross-cutting technical helpers, per ASCEND-ENG-015 §12. Domain rules do not
live here — they live in `modules/`.

| Folder / file | Purpose |
|---|---|
| `db/` | Supabase clients (browser, request-scoped server, service role). |
| `auth/` | Session helpers. Reserved. |
| `validation/` | Shared zod schemas. Reserved. |
| `logging/` | Structured logging. Reserved. |
| `security/` | Rate limiting, prompt-injection guards, file checks. Reserved. |
| `env.ts` | `requireEnv()` — fails loudly on a missing server env var. |
| `data-result.ts` | `DataResult<T>`, the read-path result type shared by several modules. |
