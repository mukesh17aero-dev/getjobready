# components/

Presentational only. Props in, JSX out.

- No data fetching, no Supabase client, no `modules/` runtime imports — type-only
  imports from a module's public API are fine.
- A component that needs data receives it as a prop from a Server Component in
  `app/`, which got it from a module.
- **A component may not import a Server Action either** — actions live beside the
  routes that use them, in `app/`, which nothing may import from. `ActionForm`,
  `GoogleButton` and `AppHeader` therefore take their action as a **prop**.

| Component | Notes |
|---|---|
| `brand-mark.tsx` | The Ascend wordmark. |
| `auth-card.tsx` | Frame for the sign-in / sign-up / password screens, plus `OrDivider`. |
| `action-form.tsx` | Client. Wraps a Server Action with banner + pending state. Exports `FormState`, the shape every auth action returns. |
| `field.tsx` | Labelled text input. |
| `form-banner.tsx` | Error / success / info message. |
| `google-button.tsx` | Client. Its own `<form>`, so it submits independently of the password form beside it. |
| `app-header.tsx` | Signed-in header: name, role badge, sign out. |
| `admin-nav.tsx` | Client. Admin section tabs; uses `usePathname` for the active state. |
| `user-table.tsx` | The admin user list. Receives `canChange` per row — it never decides for itself who may be promoted. |

Extracted when a real page needed them, not scaffolded in advance.
