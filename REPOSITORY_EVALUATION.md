# SenderPlus Repository Evaluation

## What this repository is doing

This repository contains a **full-stack MVP** for Sender+, a student-focused package delivery and tracking workflow.

- **Frontend (React + Vite + Tailwind):** A demo-first UX that walks a user from a lightweight auth/confirmation flow into package submission, success confirmation, tracking, and support pages.
- **Backend (Django + Django REST Framework):** Intended APIs for auth code workflows and package lifecycle operations (`submit-package`, `track/<id>`, `advance-status/<id>`), plus package/photo storage integrations.
- **Deployment orientation:** Frontend points to a hosted backend URL and README points reviewers to a hosted Netlify app.

## Frontend summary

The frontend is a single-page app with route-based screens:

1. **Auth landing** (`/`) with login/signup/skip buttons (demo navigation).
2. **Confirmation code page** (`/confirm`) with a 6-digit input UX and demo bypass.
3. **Home page** (`/home`) that promotes package submission, tracking, and support.
4. **Submit page** (`/submit`) posting multipart form data to backend.
5. **Success page** (`/submit-success`) that shows returned tracking ID and deep-links to tracking.
6. **Track page** (`/track`) that fetches package details, renders a status timeline, and offers a demo status-advance action.
7. **Support page** (`/support`) with static support contact placeholders.

Styling is Tailwind-based with a shared `.input` class and branded color accents.

## Backend summary

The backend contains two Django apps:

- **accounts**: email/password signup/signin plus generated email verification codes (`send-code`, `verify-code`).
- **packages**: package model (sender/recipient details, weight/value, optional photo, status machine) and intended endpoints to submit, track, and advance delivery status.

Important implementation traits:

- Package status lifecycle is codified (`waiting_bus` → `en_route_campus` → `at_campus_hub` → `delivered`).
- Tracking IDs are generated from shortened UUIDs.
- Cloudinary storage is configured for media, with permissive CORS and console email backend for dev/demo.

## Current health and risks

### ✅ Working area
- Frontend build succeeds (`npm run build`).

### ❌ Critical blocker
- Backend is currently **non-runnable** due to a syntax error in `backend/packages/views.py`.
- The file appears to contain a malformed merge/concatenation where APIView code and function-based view code are interleaved.
- As a result, `python manage.py test` fails before tests can execute.

## Practical interpretation

As it stands, this repo appears to be a **demo-focused MVP in transition**:

- Frontend user flow is mostly complete and presentation-ready.
- Backend design and tests suggest intent for production-style APIs.
- But backend code integrity is currently broken by a merge artifact, preventing runtime validation.

## Suggested next step (highest priority)

Repair `backend/packages/views.py` by selecting one coherent implementation style (class-based DRF views or function-based Django views), then rerun backend tests and verify frontend↔backend contract consistency (`tracking_id`, `status`, `status_display`, and `photo_url` fields).
