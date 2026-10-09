# Deploying AURELIA to blitz.cloud

This guide walks you through hosting the **AURELIA storefront** (Next.js 15 + Prisma + MySQL) on [blitz.cloud](https://blitz.cloud).

---

## Architecture on blitz.cloud

- **Web App**: Next.js 15 standalone container listening on port `8080` (runs as non-root user `nextjs` as required by blitz.cloud).
- **Database**: Managed MySQL database provisioned directly inside blitz.cloud with 1 click.
- **Continuous Deployment**: Every `git push` to your GitHub repository automatically triggers a build and deploys with free SSL/HTTPS.

---

## Step 1: Push Your Code to GitHub

Make sure all recent fixes and configuration files are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Configure container build for blitz.cloud hosting"
git push origin feature/aurelia-phase-1
```
*(If you want to deploy from `main`, merge this branch into `main` and push).*

---

## Step 2: Create New App on blitz.cloud

1. Log in to your [blitz.cloud dashboard](https://blitz.cloud).
2. Click **"Host something new"**.
3. Choose **"My own code"** and connect your **GitHub account**.
4. Select your AURELIA repository and target branch.
5. Blitz.cloud will automatically detect the [Dockerfile](file:///c:/Users/hp/OneDrive/Desktop/clothes/clothing/clothing/Dockerfile) in the root of the project.

---

## Step 3: Enable Managed MySQL Database

1. In the app settings on blitz.cloud, look for the **"Needs a database"** toggle.
2. Turn it **ON** and choose **MySQL** (or MariaDB).
3. Blitz.cloud will automatically create a private, managed database instance and display its connection details.

---

## Step 4: Configure Environment Variables

In your blitz.cloud app dashboard, navigate to the **Environment** tab and add the following variables:

### Required Variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mysql://...` | Connection string from the blitz.cloud MySQL instance |
| `NEXTAUTH_SECRET` | *(Generate a 32-char secret)* | Secret for session tokens (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) |
| `NEXTAUTH_URL` | `https://your-app.blitz.cloud` | Your blitz.cloud assigned URL (or your custom domain) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.blitz.cloud` | Same as `NEXTAUTH_URL` |
| `PORT` | `8080` | Required port for blitz.cloud container networking |
| `CLEANUP_SECRET` | *(Random string)* | Protects the cleanup cron endpoint |

### Optional / Integration Variables (Add when ready):

| Variable | Description |
| :--- | :--- |
| `EMAIL_GMAIL_USER` & `EMAIL_GMAIL_PASS` | Gmail App Password for customer order emails & OTPs |
| `EMAIL_FROM` | Sender display name, e.g. `AURELIA <yourstore@gmail.com>` |
| `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` | Live or test Razorpay gateway keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay key ID |
| `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (if enabling Google login) |
| `NEXT_PUBLIC_GOOGLE_AUTH` | Set to `"true"` if using Google login |

---

## Step 5: Deploy & Automated Schema Migration

1. Click **Deploy**.
2. blitz.cloud will build the multi-stage Docker container using:
   - Node 20 runtime
   - Standalone Next.js bundle
   - Automatic execution of `npx prisma migrate deploy` via `docker-entrypoint.sh` on container start.
3. Once the build finishes, your app will be live with full HTTPS at `https://your-app-name.blitz.cloud`.

---

## Step 6: Create the Admin Account & Seed Products

Once the database is up, you can seed the default categories and create your superadmin account:

### Option A: From your local machine against the production DB
You can temporarily run migrations and scripts against the blitz.cloud MySQL database by putting its connection string in your local `.env`:

```bash
# 1. Seed categories & products
npm run db:seed

# 2. Create the superadmin user
npm run admin:create
```

### Option B: Via Blitz CLI / App Terminal
In the blitz.cloud console/terminal for your running app:

```bash
node scripts/create-admin.cjs
```

---

## Step 7: Custom Domain (Optional)

1. In the blitz.cloud dashboard, open **Domains**.
2. Add your custom domain (e.g., `store.yourdomain.com` or `yourdomain.com`).
3. Add the `CNAME` or `A` record specified by blitz.cloud to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.).
4. SSL certificates are provisioned automatically.
5. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` in the Environment tab to your custom domain.
