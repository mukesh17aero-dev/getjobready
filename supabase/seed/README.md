# supabase/seed

Empty — the previous seed is in `supabase/archive/seed.sql`.

Reference data (roles, competencies, dimensions, rules) is seeded per owning module:

```
NNNN_<owning-module>_seed.sql
```

Seed inserts are guarded (`where not exists`) so re-running is safe. Seed data is
configuration, not user data — it belongs to the module that owns the table.
