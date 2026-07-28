# Identity & Access

**Owns:** `user_account`, sign-in and sign-up, roles, role changes, employer
provisioning, and where a signed-in person is allowed to go.
**Does not own:** student evidence, role standards, or anything a student produces.
Employer *details* (organisation, sector, review history) belong to
`modules/employer-review` — this module knows only that someone is an employer.

## The rule this module exists to hold

**A person's role is read from the database, server-side, on every request.** It is
never taken from a form field, a cookie, a query string, or a dropdown. There is no
code path anywhere in the platform by which someone can tell us what they are.

Three consequences that look like restrictions and are actually the point:

- **Sign-up creates students, and only students.** `signUpStudent()` has no role
  parameter.
- **Sign-in has no role selector.** You give your credentials; the server looks up
  what you are and sends you to `/dashboard`, `/admin` or `/portal`.
- **The admin functions never accept an actor.** `changeUserRole()` and
  `registerEmployer()` read the acting admin from the session themselves. A page
  cannot say who it is acting as, so a mistake in `app/` cannot become a privilege
  escalation.

## Public API (`index.ts`)

| Function | Purpose |
|---|---|
| `getCurrentUser()` | The signed-in person, or `null`. Self-heals a missing `user_account` row. |
| `authorizeRole(role)` | Returns a decision, not a redirect — `app/` performs the redirect. |
| `signInWithPassword({identifier, password})` | `identifier` is an email **or** a username. |
| `signUpStudent({fullName, email, password})` | Self-service registration. Students only. |
| `startGoogleSignIn(next)` | Returns the Google URL for `app/` to redirect to. |
| `completeCodeExchange(code)` | Completes Google, email-confirmation, invitation and password-reset returns. |
| `sendPasswordReset({email})` · `updatePassword({...})` | |
| `signOut()` | |
| `listAccounts({query})` | Admin only. Everyone who has signed in, newest first, optionally searched. |
| `changeUserRole({userId, role})` | Admin only. Promotes or demotes between the three roles. |
| `registerEmployer({fullName, email})` | Admin only. Creates the account and emails an invitation. |
| `homeRouteForRole` · `canAccessRoute` · `postSignInRoute` · `safeNextPath` · `canChangeRole` | Pure rules — the only definition of who may go and do what. |

## Who can see what

| Viewer | `/dashboard` | `/admin` | `/portal` |
|---|:--:|:--:|:--:|
| Student | ✓ | | |
| Employer | | | ✓ |
| Admin | ✓ | ✓ | ✓ |

`canViewArea()` is the single definition. An admin needs to see what a student sees
and what an employer sees in order to support either — but **viewing is not acting**:
they still hold an admin session, and each area's own rules still apply.

### Preview mode

An admin can switch into another role's view from the header. The chosen role lives
in an `httpOnly` cookie and can only ever **narrow** what is reachable — an admin may
already open every area, so previewing as a student *removes* the admin console
rather than granting anything. That is why a forged cookie is harmless: a non-admin's
preview cookie is never even read.

Two properties worth keeping:

- **While previewing, `/admin` is genuinely unreachable.** Otherwise it would not be
  a preview. The exit control is on screen at all times.
- **Administrative functions use the real role, never the previewed one.** An admin
  previewing as a student can still change roles and invite employers — preview
  changes what they see, not what they may do.

Signing out clears it, so the next person on that browser does not inherit it.

## Account history

`user_account` is a Type 2 slowly-changing dimension: one row per **version** of a
person, exactly one of which is active. Nothing is overwritten, so "who made this
person an admin, and when?" has an answer that survives the next change.

Every read filters `is_active`. Every write goes through the Postgres function
`set_user_account_state()`, which closes the old row and opens the new one in a
single transaction — done as two round trips from here, a failure in between would
leave someone with no active row, and the next request would recreate them as a
student. An admin could be demoted by a dropped connection.

Full column meanings are in `docs/data/OWNERSHIP.md`, including the rule that other
modules' foreign keys point at `auth.users(id)` or `user_id` — never `account_id`.

## Who may change a role

`canChangeRole()` is pure and lives in `roles.ts` with the routing rules, because it
decides who can grant admin rights — the highest-consequence decision here. It
refuses three cases:

1. **The actor is not an admin.** Enforced in the rule itself, not only in the page.
2. **The actor is the target.** Self-demotion could leave nobody able to reach the
   console; self-promotion is the escalation this design exists to prevent.
3. **The target is the setup account.** It is the way back in when something goes
   wrong; demoting it by accident removes exactly the thing you would then need.

The `updateRole` query *also* carries `.eq("is_bootstrap_admin", false)`. A privilege
rule enforced in one place survives exactly until someone adds a second caller.

The admin page renders its controls from this same function — it never works out for
itself who may be promoted.

## The break-glass admin

One username and password, from `ADMIN_BOOTSTRAP_USERNAME` and
`ADMIN_BOOTSTRAP_EMAIL`, whose auth user is created by hand in the Supabase
dashboard. It exists so there is a way in before any admin account does.

**It never retires** — a deliberate decision by the founder on 2026-07-27, reversing
an earlier automatic cut-off. The consequences to keep in mind:

- Once deployed, that shared password is reachable from a login form open to the
  internet. It should be long and unique, and it should not be the account anyone
  uses day to day.
- **The only off-switch is removing `ADMIN_BOOTSTRAP_USERNAME` from the
  environment.** There is no in-app control, and no code path that disables it.
- Its role cannot be changed from the user list, so it cannot be demoted by mistake.

## What is deliberately not here

- **Rate limiting.** Belongs in `lib/security/`, still reserved. Supabase applies its
  own limits on auth endpoints meanwhile.
- **A general audit log.** `audit_event` belongs to `pilot-metrics`, which is not
  built. Until it is, identity records the provenance of its own data:
  every version of `user_account` records `created_by` and `created_at`, which
  answer "who made this person an admin, and when".
- **Employer detail and student provisioning.** An admin can promote an existing
  account to any role, and can invite an employer. Bulk student import belongs to
  `student-discovery`.

## Notes on the shape of things

- **No enumeration.** Sign-in failures return one message for every cause, and
  `sendPasswordReset` reports success even for an unknown address. Otherwise both
  forms become tools for checking who has an account here.
- **Passwords are 8 characters minimum, with no complexity rules.** Complexity
  requirements push people towards `Password1!` and towards writing it down.
- **`user_account` has no write policy.** RLS lets a person read their own row and
  nothing else; every write goes through this module with the service-role key. A
  student cannot promote themselves because no policy permits them to write here at
  all — verified against the live database, not just assumed.
- **The sign-in path selects the smallest set of columns it needs.** The admin list
  asks for more; keeping them apart means a column added for one screen cannot break
  authentication for everyone.
