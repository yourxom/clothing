# AURELIA — Setup & Go-Live Guide

This guide covers everything **you** need to do to take AURELIA from the current
state to a live, fully working store. Follow the steps in order.

---

## What's already built and working

- Full catalogue, product pages, search (instant), shop with pagination
- User accounts: register, login, email verification, password reset, Google login (optional)
- Cart + wishlist (guest via browser, synced to DB when logged in)
- Checkout with GST, coupons, saved addresses, Razorpay integration
- Orders: history, detail, invoice download, cancellation, returns
- Reviews (with moderation), stock indicators, restock "notify me"
- Admin panel: dashboard, orders, products, inventory, coupons, returns, users, messages, newsletter, reviews
- Emails: welcome, verification, order confirmation, shipping, password reset
- Rate limiting, cookie consent, sitemap, robots, SEO metadata, analytics

**Only product images are not yet integrated** (deliberately deferred).

---

## STEP 1 — Prerequisites (one time)

You need these installed locally:
- **Node.js 18+** and npm
- **MySQL 8+** running (currently configured on `127.0.0.1:3307`)

---

## STEP 2 — Environment variables

Open `.env` in the project root (`clothing/clothing/.env`) and set each value.

### 2a. Required — App secret
Generate a strong secret and paste it into `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```
If you don't have openssl, use any random 32+ character string.

### 2b. Required — Site URL
- Local dev: `NEXT_PUBLIC_SITE_URL="http://localhost:3000"` and `NEXTAUTH_URL="http://localhost:3000"`
- Production: set both to your real domain, e.g. `https://aurelia.in`

### 2c. Database
`DATABASE_URL` is already set for local MySQL. For production, point it at your
hosted MySQL (PlanetScale, Railway, AWS RDS, etc.).

---

## STEP 3 — External accounts (link these when ready)

Each of these is **optional** — the site runs without them, but these features
stay in "demo/log-only" mode until configured.

### 3a. Razorpay (to accept real payments)
1. Sign up at https://dashboard.razorpay.com
2. Go to **Settings → API Keys → Generate Key**
3. Copy the Key ID and Key Secret into `.env`:
   ```
   RAZORPAY_KEY_ID="rzp_test_xxxxx"
   RAZORPAY_KEY_SECRET="your_secret"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxx"
   ```
4. Use **test keys** (`rzp_test_`) for testing, **live keys** (`rzp_live_`) only in production.
   Once set, checkout automatically opens the Razorpay payment modal.

### 3b. Resend (to send real emails)
1. Sign up at https://resend.com
2. Verify your sending domain (or use their test domain for dev)
3. Create an API key → paste into `.env`:
   ```
   RESEND_API_KEY="re_xxxxx"
   EMAIL_FROM="AURELIA <hello@yourdomain.com>"
   ```
   Until set, emails log to the server console (dev) instead of sending.

### 3c. Google login (optional)
1. Go to https://console.cloud.google.com → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (type: Web application)
3. Add authorized redirect URI: `{YOUR_SITE_URL}/api/auth/callback/google`
   (e.g. `http://localhost:3000/api/auth/callback/google`)
4. Paste into `.env` and enable the button:
   ```
   GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="xxxxx"
   NEXT_PUBLIC_GOOGLE_AUTH="true"
   ```

---

## STEP 4 — Install & set up the database

From `clothing/clothing/`:

```bash
npm install
npx prisma migrate deploy      # apply all migrations
npx prisma generate            # generate the DB client
```

If you're starting a fresh database, also seed the catalogue:
```bash
node prisma/seed.cjs           # if a seed file exists
```

---

## STEP 5 — Admin accounts (already created)

Two admin accounts exist in your database:

| Role | Email | Password |
|------|-------|----------|
| Superadmin | `superadmin@aurelia.in` | `SuperAdmin@2026` |
| Admin | `admin@aurelia.in` | `Admin@2026` |

**Change these passwords immediately after first login** (Account → Profile → Change password).

- **Admin** can manage orders, products, inventory, coupons, returns, reviews, messages.
- **Superadmin** can additionally promote/demote other admins.

To make any other user an admin: log in as superadmin → `/admin/users` → "Make admin".

---

## STEP 6 — Stock your catalogue (via admin panel)

1. Run the app: `npm run dev`
2. Log in as admin → go to `/admin`
3. **Set inventory:** `/admin/inventory` — enter stock quantity for each size variant.
   (All variants start at 0 = out of stock.)
4. **Publish products:** `/admin/products` — click "Publish" on products you want live.
5. **Create coupons (optional):** `/admin/coupons` — e.g. `WELCOME10` for 10% off.

---

## STEP 7 — Run locally

```bash
npm run dev        # development at http://localhost:3000
```
or for a production build:
```bash
npm run build
npm run start
```

Verify database health any time at: `http://localhost:3000/api/db-health`

---

## STEP 8 — Deploy to production

### Recommended: Vercel
1. Push the repo to GitHub.
2. Import the project at https://vercel.com/new
3. Add **all** `.env` variables in Vercel → Project → Settings → Environment Variables.
4. Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to your production domain.
5. Point `DATABASE_URL` at your production MySQL.
6. Deploy.

The included `vercel.json` sets up a daily cron (3 AM) that calls
`/api/maintenance/cleanup-tokens` to purge expired tokens. Set `CLEANUP_SECRET`
in your production env for it to run securely.

### Alternative hosts
Any Node host works (Railway, Render, a VPS). Run `npm run build && npm run start`
and ensure all env vars are set. Add a daily cron that POSTs to
`/api/maintenance/cleanup-tokens` with header `x-cleanup-secret: <CLEANUP_SECRET>`.

---

## STEP 9 — Post-launch checklist

- [ ] Changed both admin passwords
- [ ] `NEXTAUTH_SECRET` is a real random value (not the placeholder)
- [ ] Razorpay **live** keys set (only in production)
- [ ] Resend configured with a verified domain
- [ ] Inventory set and products published
- [ ] `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` point to the real domain
- [ ] `CLEANUP_SECRET` set for the cron
- [ ] Test a full order end to end (add to bag → checkout → pay → confirmation → invoice)
- [ ] Test a return request and process it in `/admin/returns`

---

## Still pending (future work)

- **Product images** — deferred by request. Needs an image host (Cloudinary /
  Vercel Blob), `next.config.ts` image domains, and swapping `FashionPlaceholder`
  for `next/image` across cards, product pages, and account.
- **Error monitoring** — add Sentry for production error tracking.
- **Restock email dispatch** — the "notify me" list is captured in the
  `StockAlert` table; a job to email those users when stock returns can be added.

---

## Quick reference — key routes

| Area | URL |
|------|-----|
| Storefront | `/` |
| Shop | `/shop` |
| Account | `/account` |
| Admin | `/admin` |
| DB health check | `/api/db-health` |
| Order invoice | `/api/orders/{id}/invoice` |
