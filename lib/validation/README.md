# lib/validation

Reserved for zod schemas shared across more than one server boundary.

Today each boundary owns its own schema locally (`app/api/assessments/route.ts`,
`app/(admin)/admin/actions.ts`). Move a schema here when a second caller needs
it — not before.

Rule: zod validation on every API input and Server Action input, always.
