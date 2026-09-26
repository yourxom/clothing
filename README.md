# AURELIA

An original, editorial Indian women's fashion storefront. This branch contains the responsive homepage and a **Phase 2 catalogue preview** with 54 demo concepts, nine category routes, and product-detail routes. The storefront still reads `lib/catalog.ts`, so it works without PostgreSQL; Phase 2 is not complete until its pages use verified database records.

Artwork is an illustrative CSS placeholder; demo prices, materials and sizes are unverified and may change. Products are not purchasable. Do not use this branch to accept real orders.

## Run and check the preview

Use Node.js >=20.9. Checkout `feature/aurelia-phase-1`, then:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

Open http://localhost:3000 and try `/shop`, `/collections/kurtas` and a product link. If the old local `aurelia-ui-patch.cjs` is still inside the repository, move it outside the project before linting; it is not needed.

## Database foundation (optional until pages are migrated)

Install PostgreSQL and create an empty development database. Set its URL in an untracked root `.env` (Prisma CLI), using `.env.example` as a template. Never put a real password in Git or a browser-visible variable. On Windows CMD, `copy .env.example .env`, then edit the URL. Alternatively, set `DATABASE_URL` in the shell.

```bash
npm run db:validate
npm run db:generate
npm run db:migrate -- --name init_catalog
npm run db:seed
```

`db:migrate` and `db:seed` require a running, reachable PostgreSQL database. The schema models category, product, image, variant and inventory records only; other requested commerce models arrive alongside their feature phases. The seed is rerunnable, inserts nine categories and 54 **unpublished** original concept products with size variants, and does not overwrite existing products. No product photos or stock are created. Currency amounts are stored as integer paise. After migration, generate and commit a reviewed migration before deploying to another environment; do not run `migrate dev` against production.

## Structure and status

- `app/` — Next.js App Router pages and styles
- `components/` — header, footer, announcement bar, product cards and fashion placeholders
- `lib/catalog.ts` — current preview data; will be replaced with repository reads after DB validation
- `prisma/schema.prisma` and `prisma/seed.cjs` — PostgreSQL catalogue foundation and safe demo seed
- `public/` — original SVG favicon

Search, filtering, sorting, wishlist and cart follow in Phase 3; authentication, checkout and orders in Phase 4. Admin, image uploads, AI jobs, CMS, SEO and broader testing are later phases. All brand copy, design and artwork are original AURELIA concepts and the project is not affiliated with any reference website.
