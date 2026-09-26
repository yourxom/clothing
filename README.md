# AURELIA

An original, editorial Indian women's fashion storefront. The current feature branch contains the responsive Phase 1 homepage plus an **early Phase 2 catalogue preview**: 54 generated original demo concepts, nine working category pages and product detail routes. This is not a transactional store. Product artwork is an illustrative CSS placeholder; demo prices, materials and sizes are unverified and may change.

## Run locally

Requires Node.js >=20.9 and npm. Checkout `feature/aurelia-phase-1`, then:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Explore `/shop`, `/collections/kurtas` and product links. Validate with:

```bash
npm run lint
npm run typecheck
npm run build
```

## Current structure

- `app/` — App Router, homepage, collection and product routes, responsive styles
- `components/` — header, footer, announcement bar, product cards and fashion placeholders
- `lib/catalog.ts` — temporary typed demo data; replace with a PostgreSQL/Prisma repository in Phase 2
- `public/` — original SVG favicon

No environment variables or database are required **for this preview**. See `.env.example`. PostgreSQL/Prisma and seeded product records are still pending. Search, filtering, sorting, wishlist and cart follow in Phase 3; authentication, checkout and orders in Phase 4. Admin, image uploads, AI jobs, CMS, SEO and testing are subsequent phases. Do not use this branch to accept real orders. All brand copy, design elements and artwork are original AURELIA concepts; this project is not affiliated with any reference website.
