# SenderPlus platform

SenderPlus connects customer delivery requests, courier work, and staff operations
through one Django API. This repository is an npm workspace monorepo for the
clients, with the Python backend maintained alongside them.

The existing customer app is live at [senderplus.netlify.app](https://senderplus.netlify.app/).
The driver and operations folders are reserved for upcoming builds; they do not
contain working apps yet.

## Layout

| Path | Responsibility | State |
| --- | --- | --- |
| `apps/customer-web/` | Existing React/Vite customer app, assets, tests, and web tooling | Working app |
| `apps/driver-mobile/` | Expo/React Native driver app | Planned |
| `apps/operations-web/` | Staff dispatch and management dashboard | Planned |
| `backend/` | Shared Django REST API, models, permissions, and migrations | Working API |
| `packages/` | Future reusable client libraries and API contracts | Reserved |
| `scripts/` | Repository development and verification commands | Tooling |
| `docs/` | Architecture, deployment guidance, and historical assessments | Documentation |

Each client owns its dependencies and environment configuration. Install JavaScript
dependencies once, from the repository root, using the single `package-lock.json`.
The existing customer UI and Django API behavior are preserved by this layout change.

## Local setup

Use Node.js 22.12 or newer (Node 22 is selected by `.nvmrc`), npm 10 or newer,
and Python 3.12, the version used by CI.

### Customer app

```bash
npm ci
cp apps/customer-web/.env.example apps/customer-web/.env
npm run dev
```

Use your platform's file-copy command on Windows. Set `VITE_API_BASE_URL` in that
app's `.env` to the desired API, for example `http://127.0.0.1:8000` for local Django.
The example retains the existing hosted API URL. If you already have a frontend
`.env` or `.env.local` at the repository root, move it into `apps/customer-web/`.
Never place backend credentials in a Vite environment variable.

### Shared API

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

On Windows, activate with `.venv\Scripts\Activate.ps1` in PowerShell.
For local development, edit `backend/.env`: set a local `SECRET_KEY`, `DEBUG=True`,
`ALLOWED_HOSTS=localhost,127.0.0.1`, and leave `DATABASE_URL` empty to use SQLite.
Set both secure-cookie flags to `False` for local HTTP. Keep local Vite in
`CORS_ALLOWED_ORIGINS`. Hosted environments continue to use Render PostgreSQL.

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

## Commands

Run these from the repository root. Activate the Python environment before running
backend tests or the full quality gate.

| Command | Action |
| --- | --- |
| `npm run dev` / `npm run dev:customer` | Start the customer app |
| `npm run build` / `npm run build:customer` | Build the customer app into root `dist/` |
| `npm run preview` | Preview that customer build |
| `npm run lint` | Lint configured client workspaces |
| `npm run test:customer` | Run customer authentication redirect tests |
| `npm run test:backend` | Run Django tests using a local SQLite test database and in-memory email |
| `npm test` | Run both test suites |
| `npm run quality-gate` | Lint, run both test suites, and build the customer app |

`npm run build` intentionally builds only the customer site. A future driver
release or operations deployment will have its own command and release process.
GitHub Actions runs the frontend checks and Django tests on pull requests and
pushes to `main`.

## Current behavior and next stages

The customer app supports registration and sign-in, profiles, package submission,
tracking, support, and display themes. Existing Django token authentication and
Cloudinary integration are still present. Supabase Auth/Storage, Django business
roles, driver workflows, dispatch, maps, messaging, and offline synchronization
are subsequent implementation stages.

- [Architecture and app boundaries](docs/architecture.md)
- [Deployment and environment locations](docs/deployment.md)
- [Historical repository evaluation](docs/archive/REPOSITORY_EVALUATION.md)
