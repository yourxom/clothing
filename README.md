# AURELIA

An original, editorial Indian women's fashion storefront. This branch contains the responsive homepage and a **Phase 2 catalogue preview** with 54 demo concepts, nine category routes, and product-detail routes. The storefront still reads `lib/catalog.ts`, so it works without MySQL; Phase 2 is not complete until its pages use verified database records.

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

## MySQL catalogue foundation (optional until pages are migrated)

Use a **new, empty local development MySQL database** dedicated to AURELIA, not a database with important data. Start your MySQL service. In MySQL Workbench, create a schema named `aurelia_dev` (or use a different name and reflect it in the URL). Create a development user with permissions for that schema. Prisma `migrate dev` also uses a temporary shadow database, so the development account needs permission to create and drop databases; if it lacks that permission, stop and use a separately configured shadow database rather than granting broad privileges to an application/production user.

In Windows CMD, from the project folder, run `copy .env.example .env` and edit the **untracked** root `.env` so `DATABASE_URL` contains your real local MySQL user, password, host, port and database name. For example, `mysql://USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/aurelia_dev`. Percent-encode special characters in the password. Never share or commit your password or `.env` file. The URL is server-side only, not a `NEXT_PUBLIC_` variable.

First validate the schema and generate the client:

```bash
npm run db:validate
npm run db:generate
```

Only after confirming the URL targets your **empty local development database**, run:

```bash
npm run db:migrate -- --name init_catalog_mysql
npm run db:seed
```

`db:migrate` and `db:seed` require a running, reachable MySQL instance. The schema models category, product, image, variant and inventory records only; other requested commerce models arrive alongside their feature phases. The seed is rerunnable, inserts nine categories and 54 **unpublished** original concept products with size variants, and does not overwrite existing products. No product photos or stock are created. Currency amounts are stored as integer paise. Review and commit the generated migration before deploying elsewhere. Never run `migrate dev` against production; do not accept a database reset prompt if it refers to data you need to keep.

## Structure and status

- `app/` — Next.js App Router pages and styles
- `components/` — header, footer, announcement bar, product cards and fashion placeholders
- `lib/catalog.ts` — current preview data; will be replaced with repository reads after DB validation
- `prisma/schema.prisma` and `prisma/seed.cjs` — MySQL catalogue foundation and safe demo seed
- `public/` — original SVG favicon

Search, filtering, sorting, wishlist and cart follow in Phase 3; authentication, checkout and orders in Phase 4. Admin, image uploads, AI jobs, CMS, SEO and broader testing are later phases. All brand copy, design and artwork are original AURELIA concepts and the project is not affiliated with any reference website.
