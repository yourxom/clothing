# AURELIA

Original editorial Indian women's fashion storefront. This branch is a **preview**, not a live store. It includes 54 original demo concepts, nine collection routes, product details, a browser-only wishlist, demo bag and comparison list. Illustrations are CSS concept artwork, not photographs. Prices, sizes and materials are unverified. Products are not purchasable; never use this branch to accept orders.

Pages read **unpublished** MySQL demo products at request time when configured; without a database URL or when the database connection is unavailable, they use the bundled `lib/catalog.ts` concepts. A successful empty database result stays empty, and unexpected database errors are surfaced rather than hidden. Published products are excluded from this preview. The fallback is not a production-commerce availability strategy.

## Run and validate

Use Node.js >=20.9 on `feature/aurelia-phase-1`:

```bash
npm install
npm run db:generate
npm test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Open the **Local** URL printed by `npm run dev` (the port may differ from 3000). Visit `/shop`, `/collections/kurtas`, `/compare`, `/wishlist`, `/bag`, and a product-detail link. Shop and collection searches, filters and sorting operate on unpublished demo products only. In the catalogue or on a product detail page, select up to **three** concepts to compare colour, fabric concept, proposed sizes and indicative price on `/compare`. Comparison is held in this browser only and does not reserve stock. The wishlist and demo bag likewise remain planning lists: proposed-size bag entries can be changed up to 10 per style/size; neither is a real cart or order. Expanding **Preview style** on the saved-style and bag pages shows illustrative artwork and demo details.

The existing bag and wishlist share a version-1 browser storage key. Comparison uses a separate key, so enabling comparison must not erase saved styles or the bag. Wishlist and bag have a 100-entry limit; comparison has a three-style limit. If storage is blocked, lists can work in memory for the current tab but may disappear on reload. Entries no longer present in the unpublished preview, or with removed proposed sizes, are not valid for preview estimates. Indicative totals are not price quotes. There is **no checkout, payment, customer account, real inventory reservation, order or delivery estimate**, and these lists collect no personal information.

## MySQL catalogue foundation

Use a **new, empty local development MySQL database** dedicated to AURELIA, not a database containing important data. Start MySQL and create a schema such as `aurelia_dev`. A development account needs access to that schema. Prisma `migrate dev` also needs a temporary shadow database; use an appropriately privileged development account or a separately configured shadow database. Do not give broad development privileges to a production application user.

In Windows CMD from the actual project directory, run `if not exist .env copy .env.example .env`. Edit the **untracked** root `.env` so `DATABASE_URL` points to your own local database, for example `mysql://USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/aurelia_dev`. Percent-encode special characters. Never share or commit `.env` or the password. The URL is server-side only, never `NEXT_PUBLIC_`.

Only for a **new, confirmed empty development database**:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
```

**If the initial migration and seed are already installed, do not rerun them for this feature.** Do not run `migrate dev` against production or accept a reset prompt for data you need. The seed is rerunnable, inserts nine categories and 54 **unpublished** original concepts with proposed size variants, and does not overwrite existing products. It creates no product photos or stock. Currency amounts are stored as integer paise and converted to rupees only for preview display.

## Structure and limits

- `app/` — request-time Next.js routes, including shop, collections, product details and browser-only planning pages.
- `components/` — header, footer, illustrative artwork, product cards and client-only planning controls.
- `lib/catalog.ts` — bundled fallback concepts and display types.
- `lib/catalog-reader.ts` — server-side unpublished MySQL reads and connection-only fallback.
- `lib/catalog-filters.ts` — pure shop and collection discovery.
- `lib/preview-list.ts` — validated, bounded browser-only wishlist, bag and separate comparison serialization.
- `lib/*.test.cjs` — catalogue reader, filters and browser-list behavior tests; no live MySQL needed.
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.cjs` — local MySQL catalogue foundation.

Authentication, verified merchandise, real image uploads, inventory, shipping/returns, payments, checkout and orders require separate design, approvals and testing before any sale. Admin, CMS, AI jobs, SEO and broader tests remain future work. Brand copy, artwork and concepts are original AURELIA ideas; this is not affiliated with any reference website.
