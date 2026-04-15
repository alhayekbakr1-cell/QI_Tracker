# QI Chief Tracker Maintenance Guide

This document contains the public-safe maintenance checklist for the **QI Chief Tracker**. Keep private operational runbooks, backup locations, and credential transfer procedures outside this repository.

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

## 🔐 Security Baseline

1. Protect GitHub, Supabase, and maintainer email accounts with MFA.
2. Never commit secrets, data exports, screenshots with sensitive content, or internal handoff notes to this repository.
3. Store backups outside the published GitHub Pages content and outside the public repository.
4. Use Supabase Auth email verification rather than shared credentials embedded in frontend code.
5. Review GitHub Actions secrets and Supabase keys whenever maintainers change.

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

## 🤝 Public Handover Checklist

When passing this project to the next Chief:

1. Ensure they have `ADMIN` access to the GitHub Repository.
2. Ensure they have access to the **Supabase Dashboard**.
3. Rotate or reissue secrets in the destination secret manager instead of sharing old copies.
4. Share the private operational runbook through an approved internal channel, not through this repository.

*Built with care for Adventist Health GME.*
