# AURELIA

Original editorial Indian women's fashion storefront. **This branch is a preview, not a live store.** It includes 54 original demo concepts, nine collection routes, product details, browser-only wishlist, demo bag and comparison, dedicated search with instant local suggestions, editorial articles, store/help pages, and clearly labelled pre-launch policy information. All illustrations are concept art, not merchandise photography. Prices, sizes and materials are unverified. Products cannot be purchased.

Pages read **unpublished** MySQL demo products at request time when configured; without a database URL or when the connection is unavailable they use the bundled `lib/catalog.ts` concepts. A successful empty result stays empty; unexpected database errors surface. Published products are excluded from this preview. The fallback is **not** a live-commerce availability strategy.

## Run and validate once for this batch

Use Node.js >=20.9 on `feature/aurelia-phase-1`. From the actual project directory, preserve local untracked files when pulling changes:

```bash
npm install
npm run db:generate
npm test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Check the local URL printed by `npm run dev`, then visit `/shop`, `/search`, `/collections/kurtas`, `/compare`, `/journal`, an article, `/about`, `/stores`, `/help`, `/privacy-policy`, `/terms-and-conditions`, `/shipping-and-returns`, and a missing URL. Check `/shop?color=Olive`, a moodboard link, instant search suggestions, result submission, and existing bag/wishlist actions. **Do not run migrations or seed for this batch.** A lint warning with zero errors is not a failed check. The repo has no automated CI run unless a workflow is separately installed. This file change via GitHub does not run local tests or a browser.

## Preview lists and search

The existing bag and wishlist share a version-1 browser storage key; comparison has a separate key. Wishlist and bag are bounded at 100 entries, comparison at three. They do not sync between browsers or reserve stock. The bag's proposed sizes and indicative total are neither availability guarantees nor quotes. `/search` provides local suggestions from the server-provided unpublished preview and GET-based server result URLs. Existing shop and collection filters remain. Color filters use exact catalogue color names; occasion moodboards search existing text and may have no results because no occasion taxonomy has been verified. No third-party search provider is used.

## MySQL catalogue foundation

`prisma/schema.prisma`, migrations and `prisma/seed.cjs` already provide a **development catalogue foundation**, including category, product, product image, variant and inventory models. The 54 seeded concepts are unpublished and have no verified stock or photos. `DATABASE_URL` is server-side and belongs in an untracked `.env`. Never share or commit a password. On a **new, confirmed empty local development database only**, the original README setup applies: `npm run db:validate`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`. If already installed, don't rerun migrations or accept a reset prompt. Do not run `migrate dev` against production.

## Launch blockers

No customer authentication, account, real checkout, payment, order, shipping quote, verified stock, email signup, admin dashboard, analytics or photo upload is active. Product pages show illustrative artwork, not verified merchandise; no size guide, product-specific care, delivery estimate or reviews are asserted. Browser-only planning lists are not real carts. The account button remains disabled, checkout does not accept orders, and newsletter addresses are not collected. Store locations and support addresses are intentionally not fabricated. Policy pages describe the **preview** and are not approved policies for live sales.

Before a live launch: supply verified product records, photos and licensed image hosting; stock and size data; shipping, taxes, cancellation and returns rules; operating entity and support information; approved legal/privacy text; payment/email-provider accounts and secrets set outside Git; secure auth/session design; transactional inventory and order processing with idempotency and payment webhook verification; admin permissions and audit logs; and real database, checkout, security, accessibility and end-to-end tests. Then separately enable checkout only after review. `app/robots.ts` blocks preview indexing; `app/sitemap.ts` emits entries only when a verified HTTPS root `SITE_URL` is configured. Robots and index metadata need deliberate launch review.
