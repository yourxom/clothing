# AURELIA — Deployment Guide

This guide covers deploying the AURELIA storefront (Next.js 15 + Prisma + MySQL) to
production. It assumes deployment to **Vercel**, but the app is portable to any
Node.js host (Railway, Render, Fly.io, a VPS, etc.).

---

## 1. Prerequisites

- A production **MySQL 8** database (PlanetScale, Railway, AWS RDS, or self-hosted).
- A domain name (e.g. `aurelia.in`).
- Accounts for the optional services you plan to enable: Resend (email),
  Razorpay (payments), Google Cloud (OAuth), Sentry (error monitoring).

---

## 2. Environment variables

Copy `.env.example` and fill in **production** values. Never commit `.env`.

**Required:**

| Variable             | Notes                                                        |
| -------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`       | Production MySQL connection string.                          |
| `NEXT_PUBLIC_SITE_URL` | Your real domain, e.g. `https://aurelia.in`.               |
| `NEXTAUTH_SECRET`    | **Generate a NEW one:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL`       | Same as your domain.                                         |
| `CLEANUP_SECRET`     | Random string; protects the token-cleanup cron.             |

**Optional (enable features as needed):**

| Variable                              | Enables                              |
| ------------------------------------- | ------------------------------------ |
| `RESEND_API_KEY`, `EMAIL_FROM`        | Transactional emails (order, OTP, restock, status) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Live checkout / payments |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_AUTH=true` | "Continue with Google" login |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring (see section 6)    |

> Emails/payments/monitoring are all **no-ops** when their keys are blank, so the
> app runs fine without them. Add keys only when you're ready for that feature.

---

## 3. Database setup

Run migrations against the production database before the first deploy:

```bash
npx prisma migrate deploy
```

Seed the catalogue (optional — creates categories + products, unpublished):

```bash
npm run db:seed
```

Then publish products and set inventory from the admin panel, or via SQL.

---

## 4. Deploy to Vercel

1. Push the repo to GitHub/GitLab.
2. Import the project in the Vercel dashboard.
3. Set the **Root Directory** to the folder containing `package.json`
   (`clothing/clothing` in this workspace layout).
4. Add all environment variables from section 2 under **Settings → Environment Variables**.
5. Deploy. Vercel auto-detects Next.js; no custom build command needed
   (`next build`).

`vercel.json` pins the region to **Mumbai (`bom1`)** for low latency in India and
registers the daily token-cleanup cron at 03:00 UTC.

### Cron authentication

Vercel Cron calls `/api/maintenance/cleanup-tokens` with
`Authorization: Bearer <CLEANUP_SECRET>`. Make sure `CLEANUP_SECRET` is set in the
Vercel environment, otherwise the route returns 503 in production.

---

## 5. Post-deploy checklist

- [ ] Visit the site over HTTPS; confirm the security headers are present
      (`curl -I https://your-domain`).
- [ ] Register a test account; confirm email verification works (if Resend enabled).
- [ ] Log in as admin; confirm the admin dashboard loads.
- [ ] Place a test order end-to-end.
- [ ] Confirm the cron runs (check Vercel → Deployments → Cron logs the next day).
- [ ] Validate structured data with Google's Rich Results Test.
- [ ] Submit `https://your-domain/sitemap.xml` to Google Search Console (if present).

---

## 6. Error monitoring (Sentry)

Sentry is wired but dormant until you set a DSN.

1. Create a project at https://sentry.io (platform: Next.js).
2. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to the project DSN.
3. (Optional, for readable stack traces) create an auth token with the
   `project:releases` scope and set `SENTRY_ORG`, `SENTRY_PROJECT`,
   `SENTRY_AUTH_TOKEN` so source maps upload at build time.

Sentry only sends events in `production`. Local/dev builds are unaffected.

---

## 7. Rollback

Vercel keeps every deployment. To roll back, promote a previous deployment from
the dashboard. Database migrations are **not** auto-rolled-back — take a DB backup
before running `prisma migrate deploy` on production.
