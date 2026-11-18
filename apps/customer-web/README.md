# Customer web app

The existing React 18, React Router, Tailwind, and Vite customer app lives here.
Source, assets, tests, and frontend configuration moved together; routes and
relative imports are unchanged.

Run `npm ci` from the repository root. Copy `.env.example` to `.env` in this folder,
then use root commands `npm run dev`, `npm run build`, and `npm run test:customer`.
You can also run this workspace directly:

```bash
npm run dev --workspace=@senderplus/customer-web
```

Production output remains at repository-root `dist/` for the existing Netlify site.
`public/_redirects` supplies the existing SPA fallback for direct route visits.
Browser-specific authentication state and API configuration remain local to this
app until the shared authentication/API work is implemented.
