# /review/[snapshotId] — reserved

Employer reviewer view of one consented passport snapshot, plus the recorded
action (no action / interview / shortlist / hire / development) and usefulness
feedback. Backed by `modules/employer-review/`.

Reads a frozen snapshot only — never raw student tables — and must stop
resolving the moment consent is revoked or expires. Not built yet; this folder
defines no route.
