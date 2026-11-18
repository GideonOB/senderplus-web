# Deployment after the workspace move

## Customer app on Netlify

Root `netlify.toml` explicitly describes the existing customer deployment:

| Setting | Value |
| --- | --- |
| Base/install directory | Repository root (`.`) |
| Build command | `npm run build` |
| Publish directory | `dist` at repository root |
| Source | `apps/customer-web/` |
| Build environment | Existing `VITE_API_BASE_URL` |

Vite writes the customer bundle to root `dist/` for compatibility with the existing
site. No site URL or API URL changes are required by this move. Node 22 is selected
by root `.nvmrc`; ensure a dashboard `NODE_VERSION` override does not select an older
unsupported version. JavaScript installation uses the root workspace lockfile.

The customer app's `public/_redirects` is copied into `dist/` as before, retaining
SPA routing. Verify `/login`, `/submit`, and `/track` direct navigation in the
deployment preview before merging. No hosting settings were changed by this PR.

Future operations hosting must use its own configuration and output directory;
it must not publish or overwrite the customer `dist/`. Native Expo releases have
a separate build/release process. The root default build will remain customer-only.

## Django on Render

Keep the existing `senderplus-django-api` service rooted at `backend/`. Existing
requirements, build/start commands, environment variables, and database connection
remain applicable because backend source paths and behavior are unchanged.
This stage creates no Render resources, changes no live configuration, and runs
no production database migrations. Do not create a second API for each client.

## Environment file locations

| Consumer | Example | Local file |
| --- | --- | --- |
| Customer Vite app | `apps/customer-web/.env.example` | `apps/customer-web/.env` |
| Django API | `backend/.env.example` | `backend/.env` |
| Future driver/operations apps | Add alongside each implementation | App-specific |

Move any existing local frontend `.env*` files from root to `apps/customer-web/`.
Hosted environment variables are still inherited by the workspace build command.
Backend secrets must never appear in client environment files or public bundles.
Supabase variables will be added when its project and integration are configured;
there are no placeholder secrets or unused Supabase variables in this change.

## Verification

Run `npm ci`, activate a Python environment with `backend/requirements.txt`, and
run `npm run quality-gate` with a customer `VITE_API_BASE_URL` configured.
`scripts/test_backend.py` uses SQLite and in-memory email instead of any configured
hosted database or mail service. GitHub Actions runs frontend and backend checks
separately without deployment credentials.

The April evaluation in `docs/archive/` is historical and is not the source of truth
for current file locations or feature status.
