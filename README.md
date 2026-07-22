# 🔗 Live App

**The SenderPlus MVP is available here:**

👉 **https://senderplus.netlify.app/**

Start at this link to sign in, submit packages, and track deliveries through the connected SenderPlus backend.

---

## Environment configuration (Render + frontend)

SenderPlus now expects environment variables for production-grade configuration. No sensitive defaults should be hard-coded.

### Backend (Render service)
Set these in Render for the Django API service:

- `SECRET_KEY` (required)
- `DEBUG` (`False` in production)
- `ALLOWED_HOSTS` (comma-separated hostnames)
- `DATABASE_URL` (Render Postgres connection string)
- `CORS_ALLOWED_ORIGINS` (comma-separated full origins)
- `CSRF_TRUSTED_ORIGINS` (comma-separated full origins)
- `CORS_ALLOW_ALL_ORIGINS` (`False` in production)
- `SESSION_COOKIE_SECURE` (`True` in production)
- `CSRF_COOKIE_SECURE` (`True` in production)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- (optional) `EMAIL_BACKEND`
- (optional) `DEFAULT_FROM_EMAIL`

Use `backend/.env.example` as the template.

> Note: backend settings now normalize common formatting mistakes:
> - `ALLOWED_HOSTS` can be entered as hostnames or full URLs (e.g. both `senderplus-django-api.onrender.com` and `https://senderplus-django-api.onrender.com` are accepted).
> - `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` will ignore trailing slashes.

### Frontend (Netlify/Vite)
Set this in your frontend host:

- `VITE_API_BASE_URL` (e.g., `https://senderplus-django-api.onrender.com`)

Use `.env.example` as the template.


### Troubleshooting: Render build fails during `python manage.py migrate` with `failed to resolve host`
If the Render build log fails at the migrate step with an error like:

```text
django.db.utils.OperationalError: failed to resolve host 'dpg-...-a': [Errno -2] Name or service not known
```

Django installed successfully, but the build container could not resolve the PostgreSQL host from `DATABASE_URL`. On Render, hostnames ending in `-a` are typically internal database hostnames, and they only resolve from Render services in the same private network/region as the database. Check that the Django API service is using the correct Render Postgres **Internal Database URL** for a database attached to that service, or switch to the database **External Database URL** if the service cannot access the private hostname. Also verify the database still exists and that the `DATABASE_URL` value was not copied from an old/deleted database.

After updating `DATABASE_URL`, redeploy the backend service so the build command can complete `python manage.py migrate`.

### Troubleshooting: signup/signin returns HTML `Bad Request (400)`
If the browser network response body is an HTML page like:

```html
<!doctype html>
<title>Bad Request (400)</title>
```

the request reached Django, but Django rejected it before your API view ran. In production, the most common cause is backend environment config:

- `ALLOWED_HOSTS` must include your Render backend hostname (e.g. `senderplus-django-api.onrender.com`)
- `CORS_ALLOWED_ORIGINS` must include your frontend origin (e.g. `https://senderplus.netlify.app`)
- `CSRF_TRUSTED_ORIGINS` must include your frontend origin (e.g. `https://senderplus.netlify.app`)

After updating env vars on Render, redeploy the backend service.

---

## CI / automation note

This repository does not use GitHub Actions. Run checks locally before pushing changes:

- `npm run lint`
- `npm run build`
- `npm run quality-gate` (runs lint, build, and backend auth tests)
