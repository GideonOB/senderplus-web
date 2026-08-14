# SenderPlus

SenderPlus is a package delivery web application that lets customers create an
account, submit a delivery request, and follow a package from dispatch to
delivery. It combines a responsive React interface with a Django REST API for
authentication, customer profiles, and package management.

## Live application

The SenderPlus MVP is available at
[senderplus.netlify.app](https://senderplus.netlify.app/).

## Features

- Account registration, sign-in, and confirmation flows
- Protected customer dashboard and profile management
- Package submission with sender, recipient, and delivery details
- Delivery tracking with a visual status timeline
- Support page for customer assistance
- Light, dark, and forest display themes
- Responsive layouts for desktop and mobile devices

## Technology

### Frontend

- React 18
- React Router
- Tailwind CSS
- Vite

### Backend

- Django 5
- Django REST Framework
- PostgreSQL-compatible database configuration
- Cloudinary-backed media storage

## Repository structure

```text
senderplus-web/
├── public/                 # Public frontend assets
├── src/
│   ├── components/         # Shared React components
│   ├── pages/              # Route-level application screens
│   ├── App.jsx             # Routes and application providers
│   ├── api.js              # Frontend API client
│   └── index.css           # Global styles and themes
└── backend/
    ├── accounts/           # Authentication and profile API
    ├── packages/           # Package submission and tracking API
    └── senderplus_core/    # Django project configuration
```

## Local development

### Prerequisites

- Node.js 18 or later
- npm
- Python 3.10 or later

### Frontend

```bash
npm install
npm run dev
```

Vite will print the local URL after the development server starts.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Configuration templates are provided in `.env.example` and
`backend/.env.example` for connecting the frontend and API in a local or hosted
environment.

## Quality checks

Run the frontend checks from the repository root:

```bash
npm run lint
npm run build
```

To run the combined frontend and backend verification suite:

```bash
npm run quality-gate
```

## Main application routes

| Route | Purpose |
| --- | --- |
| `/` | Product and authentication landing page |
| `/signup` | Create a customer account |
| `/login` | Sign in to an existing account |
| `/home` | View the authenticated dashboard |
| `/submit` | Create a package delivery request |
| `/track` | Review package progress |
| `/profile` | Manage customer details |
| `/support` | Access customer support |
