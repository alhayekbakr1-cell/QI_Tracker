# QI Chief Tracker Maintenance Guide

This document provides the essential information for maintaining the **QI Chief Tracker** and handing it over to future Chief Residents.

## 🚀 Quick Start

To launch the development environment:

```bash
# Using Docker (Recommended for new Chiefs)
docker-compose up

# Using NPM
cd dashboard
npm install
npm run dev
```

## 🛠 Tech Stack & Services

* **Frontend**: Next.js (App Router), TypeScript, Vanilla CSS.
* **Database**: Supabase (PostgreSQL).
* **AI**: Google Gemini Pro (via `@google/generative-ai`).
* **Hosting**: GitHub Pages (Static Site).

## 🔐 Administration

### 1. Promoting a User to Admin

To grant someone "Overseer" (Admin) status:

1. Go to the **Admin Console** in the app.
2. Find the user in the registered users table.
3. Click "Promote" until they reach the desired role.
4. *Note*: For safety, Admin status cannot be revoked via the UI; use the Supabase Dashboard SQL Editor for that.

### 2. Updating the Personnel Directory

The app validates signups against `directory_rows.csv`.

1. Add new residents/faculty to `directory_rows.csv`.
2. Commit the change to GitHub.
3. The system will automatically recognize the new emails during their first login.

## 🏥 Monitoring & Reliability

### 1. Error Logs

Check the **Admin Console > System Error Monitor** for real-time bug reports from users.

### 2. Dependency Security

GitHub **Dependabot** is active. It will automatically create Pull Requests for security patches. Always review and merge these periodically.

### 3. CI/CD Protection

The site is protected by **Smoke Tests**. If a change breaks the homepage or login, the deployment will fail. You can see build status in the **GitHub Actions** tab.

## 📦 Deployment

Deployments are automatic upon pushing to the `main` branch.

* **Repository**: `alhayekbakr1-cell/QI_Tracker`
* **Live Site**: `https://alhayekbakr1-cell.github.io/QI_Tracker/`

## 🤝 Handover Checklist

When passing this project to the next Chief:

1. Ensure they have `ADMIN` access to the GitHub Repository.
2. Ensure they have access to the **Supabase Dashboard**.
3. Share the `GOOGLE_GENERATIVE_AI_API_KEY` with them securely.
4. Direct them to this `MAINTENANCE.md` file.

*Built with ❤️ for Adventist Health GME.*
