# Authentication rollout

This phase adds Supabase email/password identity and Django business roles, disabled
by default. The current customer login remains available with `VITE_AUTH_PROVIDER=legacy`.
No live environment variables, Supabase settings or production data were changed.

Senderplus project: `https://qssrvrhizirzcsygqpfg.supabase.co`. The connected Supabase
account could not access this project during implementation. Real email delivery,
signing keys and live sign-in still require project-level verification.

## Responsibilities and permissions

- Supabase manages passwords, email confirmation and refreshable sessions.
- Django validates ES256/RS256 signatures against project JWKS, issuer,
  `authenticated` audience, expiry and subject. HS256/anonymous users are rejected.
- `/auth/session` also queries Supabase Auth to confirm the verified email before
  creating the Django identity mapping and customer profile.
- Render PostgreSQL stores the unique Supabase subject mapping and business roles.
  JWT `user_metadata`, `app_metadata` and submitted profile fields cannot grant roles.
- API permissions use current Django roles and `User.is_active`. Disabling that
  user immediately blocks application API access, including existing JWTs.
- Only Django superusers may edit business roles through Django admin. Its standard
  change log records those edits. A business `admin` role does not grant admin-site
  login or `is_superuser`.

| Role | Permission supplied in this phase |
| --- | --- |
| Customer | Own profile; default for new and existing users |
| Driver | Role foundation only; no arbitrary package status updates |
| Dispatcher | Existing package status-advance endpoint |
| Manager | Existing package status-advance endpoint |
| Admin | Existing package status-advance endpoint; no role-management API |

Multiple roles are allowed. Legacy `is_staff` retains its package-status permission
during migration. Delivery ownership, assignments, branch scope, allowed status
transitions and operational audit events are separate work. Existing submit/track
endpoints remain public in this phase; the delivery API is not yet launch-ready.

## Configure Supabase before activation

1. Reconnect Supabase with access to the Senderplus organization/project.
2. Enable email/password sign-in with email confirmation. Use an asymmetric signing
   key (ES256 preferred, RS256 supported). Set minimum password length to at least
   eight, require the current password for changes, and enable secure password
   change/reauthentication. Review the JWT lifetime; 15 minutes is a reasonable
   starting point for this application.
3. Configure custom SMTP before inviting testers outside the Supabase organization.
   Default mail has recipient/send limits. Keep confirmation enabled and test
   signup, resend and password-change emails with real inboxes.
4. Set Site URL to the approved customer origin. Allow callback URLs including the
   `next` query string. Example patterns:
   `https://senderplus.netlify.app/auth/callback**` and
   `http://localhost:5173/auth/callback**`. Match the actual browser origin;
   `localhost` and `127.0.0.1` differ. Add only approved preview origins.
   The app builds callback URLs itself and allowlists internal `next` destinations.
5. Use the standard confirmation-link template. PKCE confirmation must open in
   the signup browser. If confirmation happens elsewhere, return to the original
   browser or sign in with the confirmed email/password.
6. Retrieve the project's **publishable** key (`sb_publishable_…`). This phase
   needs no secret or service-role key. Never put privileged keys in frontend
   variables, source control, screenshots or chat.

The Data API may stay disabled. Delivery tables stay in Render; there are no
Supabase business-table migrations. Private Storage buckets/policies come later.

## Environment variables

| Environment | Variable | Value |
| --- | --- | --- |
| Render `senderplus-django-api` | `SUPABASE_URL` | `https://qssrvrhizirzcsygqpfg.supabase.co` |
| Render | `SUPABASE_PUBLISHABLE_KEY` | Senderplus publishable key |
| Render | `SUPABASE_AUTH_ENABLED` | `True` after migrations and project verification |
| Customer development / Netlify | `VITE_SUPABASE_URL` | Same project URL |
| Customer development / Netlify | `VITE_SUPABASE_PUBLISHABLE_KEY` | Same publishable key |
| Customer development / Netlify | `VITE_AUTH_PROVIDER` | `supabase` for pilot; otherwise `legacy` |

Keep `DATABASE_URL` on Render PostgreSQL 18 and `VITE_API_BASE_URL` on Django.
Existing CORS/CSRF configuration still applies. Frontend environment changes need
a rebuild. Future clients use the same identity/API contract with separate builds.

## Deployment and existing accounts

1. Review and merge the PR, install dependencies, and run `python manage.py migrate`
   against the intended Render database **before** the updated API starts.
   Migration `accounts.0005` creates identity/role tables and gives existing users
   a customer role while retaining existing staff privileges.
2. Configure and verify Supabase, then enable backend Supabase auth while leaving
   the live frontend on legacy authentication.
3. Test a dedicated Supabase-enabled customer preview with new test accounts.
   Existing Django credentials are not automatically copied.
4. To migrate an ordinary customer, obtain a legacy `Token` through the normal
   verified login and a Supabase access token through confirmed email/password
   sign-in. POST `/auth/link-supabase` with the legacy token in the Authorization
   header and JSON `{ "access_token": "<Supabase access token>" }`.
   Both accounts need the same verified email. This preserves the Django user,
   profile and roles and retires legacy passwords, tokens, codes and trusted devices.
   Test with a disposable account first. There is no self-service migration screen
   yet. Staff/superuser accounts need a separately reviewed migration procedure;
   this endpoint rejects them.
5. Complete the migration plan before switching the live customer frontend.
   Email matches alone return `409 account_link_required` and never link accounts.

Rolling the frontend back to `legacy` only helps users who have not migrated.
Linked users still need a Supabase-enabled client/backend; a flag does not restore
retired credentials. Keep a Supabase entry point available during a mixed pilot.
Do not reverse the identity migration or disable Supabase after linking accounts
without a separate recovery plan.

## Session behaviour and remaining work

- The web SDK owns browser session persistence/refresh. Django receives access
  JWTs; this flow sends neither passwords nor refresh tokens to Django.
- Protected pages await restoration and the API profile. Failed requests offer
  retry; stale responses cannot undo sign-out or replace a newer session. Profile
  refresh keeps authenticated pages mounted.
- Sign-out targets the current session. Issued access JWTs may remain usable until
  expiry: local verification is not per-request revocation checking. Use Django
  account disablement for immediate application access removal. JWKS are cached
  for five minutes; account for Supabase's caches during key rotation.
- Staff MFA, self-service account migration, email-change/account-deletion
  synchronization and delivery object permissions remain pre-launch work.
- Signup metadata seeds validated profile fields once; later edits stay in Django.
- Cloudinary/profile uploads remain until the private Storage integration.

Run `npm run test:customer`, `python scripts/test_backend.py`, `npm run lint`, and
build each provider mode. For browser checks, install Chromium with
`npx playwright install chromium` and run `npm run test:auth-browser`.
GitHub Actions also runs this browser suite; local browser launch may be restricted
in managed workspaces. Tests use local JWT keys, mocked Auth responses, SQLite
and in-memory email. Before activation, verify real signup/confirmation, login,
reload, expiry/refresh, password email, logout, disabled-user rejection and role
revocation against the Senderplus project.

## Upstream references

- [JWT verification](https://supabase.com/docs/guides/auth/jwts)
- [Signing keys](https://supabase.com/docs/guides/auth/signing-keys)
- [Password security](https://supabase.com/docs/guides/auth/password-security)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
