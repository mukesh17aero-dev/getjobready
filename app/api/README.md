# app/api — reserved

Route handlers for machine callers (the existing GJR engines post assessment
results here). Browser-driven mutations use Server Actions instead.

A route handler is a thin adapter: parse and zod-validate the request, call **one**
module function, map its result to a response. No database queries, no business
rules, no multi-table orchestration. Not built yet.
