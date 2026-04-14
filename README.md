# 🔗 Live Demo

**The SenderPlus MVP is available here:**

👉 **https://senderplus.netlify.app/**

Reviewers can start at this link and use the **“Skip (demo)”** flow to experience the end-to-end package submission and tracking process. The live app includes both the web frontend and a connected backend, so everything needed for the demo is accessible from this single URL.

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

### Frontend (Netlify/Vite)
Set this in your frontend host:

- `VITE_API_BASE_URL` (e.g., `https://senderplus-django-api.onrender.com`)

Use `.env.example` as the template.

---

## CI / automation note

This repository does not use GitHub Actions. Run checks locally before pushing changes:

- `npm run lint`
- `npm run build`
- `npm run quality-gate` (runs lint, build, and backend auth tests)
