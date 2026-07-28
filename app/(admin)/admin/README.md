# /admin — reserved

Admin console: dimensions and role standards, the versioned rules editor, student
list, audit log viewer, force recalculation.

Backed by `modules/role-standards/` and `modules/pilot-metrics/`. Access is an
Identity & Access concern — the check calls `@/modules/identity`, it is never
re-implemented in a page. Not built yet; this folder defines no route.
