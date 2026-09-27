# AURELIA

An original, editorial Indian women's fashion storefront. The preview has 54 demo concepts, nine category routes, and product-detail routes. Storefront pages read **unpublished** demo products from the MySQL catalogue at request time when configured; otherwise they use the bundled `lib/catalog.ts` preview. An available database with zero unpublished records shows an empty preview rather than silently filling it with bundled products.

Artwork is an illustrative CSS placeholder; demo prices, materials and sizes are unverified and may change. Products are not purchasable. Do not use this branch to accept real orders. Published products are intentionally excluded from this preview and require a separately designed, verified commerce flow.

## Run and check the preview

Use Node.js >=20.9. Checkout `feature/aurelia-phase-1`, then:

```bash
npm install
npm run db:generate
npm test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Open http://localhost:3000 and try `/shop`, `/collections/kurtas` and a product link. The homepage, shop, collection, product, saved styles and demo bag pages are rendered at request time to avoid baking local database records into the build. With `DATABASE_URL` configured and a reachable MySQL instance, the demo preview uses MySQL; with no URL or a connection failure it uses the bundled demo. Other DB errors (such as authentication or migration problems) are surfaced so they can be fixed. This fallback is for previews only, not a production commerce availability strategy. If the old local `aurelia-ui-patch.cjs` is still inside the repository, move it outside the project before linting; it is not needed.

## Preview discovery and planning lists

`/shop` shows all demo styles with search, category/size filters and sorting. Save ideas from product cards or detail pages, then open `/wishlist`. Select a proposed size on a product page to add that style to `/bag`; adjust the demo quantity (maximum 10 per style/size) or remove it. On either list, expand **Preview style** to view concept artwork, current demo colour, fabric and proposed sizes and indicative price without leaving the page; use the product link for full demo details. This is illustrative artwork, not a real product photograph. Entries no longer present in the unpublished preview, or bag entries with removed sizes, cannot be previewed and are excluded from the estimate.

Both lists are held only in browser localStorage, capped at 100 entries per list and not synced to an account. If storage is blocked the list works in memory for the current tab but is not guaranteed to persist on reload; the page displays a notice. Storage can also be cleared; then saved entries disappear. No stock is reserved. The bag's indicative total is not a price quote. There is **no checkout, payment, customer account, order or delivery estimate**; no personal information is collected by these list features. Verify products, prices, inventory and the commerce flow separately before any real sale.

## MySQL catalogue foundation

Use a **new, empty local development MySQL database** dedicated to AURELIA, not a database with important data. Start your MySQL service. In the MySQL monitor, create a schema named `aurelia_dev` (or use a different name and reflect it in the URL). A development account needs access to that schema. Prisma `migrate dev` also uses a temporary shadow database, so a development account requires permission to create and drop databases or an explicitly configured shadow database; don't grant broad privileges to an application/production user.

In Windows CMD, from the project folder, run `if not exist .env copy .env.example .env` and edit the **untracked** root `.env` so `DATABASE_URL` contains your real local MySQL user, password, host, port and database name. For example, `mysql://USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/aurelia_dev`. Percent-encode special characters in the password. Never share or commit your password or `.env` file. The URL is server-side only, not a `NEXT_PUBLIC_` variable.

For a new database, validate, generate, and only after confirming it targets an empty local development database, apply the tracked migration and seed:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
```

**If your development database already has the initial migration and seed, do not rerun them just to check out these changes.** Use `npm run db:generate` and the read/test/build commands above. The schema models category, product, image, variant and inventory records only; other commerce models arrive alongside their feature phases. The seed is rerunnable, inserts nine categories and 54 **unpublished** original concept products with size variants, and does not overwrite existing products. No product photos or stock are created. Currency amounts are stored as integer paise, converted to rupees only for the preview display. Never run `migrate dev` against production; do not accept a database reset prompt if it refers to data you need to keep.

## Structure and status

- `app/` — request-time Next.js App Router pages and styles
- `components/` — header, footer, announcement bar, product cards, fashion placeholders and browser-only preview lists
- `lib/catalog.ts` — bundled fallback preview data and stable display types
- `lib/catalog-reader.ts` — server-side MySQL unpublished concept reads and connection-only fallback
- `lib/catalog-reader.test.cjs` — mapping, empty-result and fallback tests; does not need MySQL
- `lib/preview-list.ts` and `lib/preview-list.test.cjs` — bounded wishlist and demo bag state and validation
- `prisma/schema.prisma`, `prisma/migrations/` and `prisma/seed.cjs` — MySQL catalogue foundation
- `public/` — original SVG favicon

Authentication, checkout and orders require verified merchandise and dedicated implementation. Admin, image uploads, AI jobs, CMS, SEO and broader testing are later phases. All brand copy, design and artwork are original AURELIA concepts and the project is not affiliated with any reference website.
