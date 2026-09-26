# AURELIA

An original, editorial Indian women's fashion storefront. This branch contains **Phase 1 only**: Next.js setup, responsive design system, navigation, footer, and a preview homepage. It does not yet offer purchases, customer accounts, a product catalogue, checkout, or working email subscription. Visuals are intentional CSS placeholders; no third-party photographs are used.

## Run locally

Requires Node.js >=20.9 and npm. Checkout `feature/aurelia-phase-1`, then:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validate with `npm run lint`, `npm run typecheck`, and `npm run build`.

## Structure

- `app/` — App Router, home page, metadata and global styles
- `components/` — header, footer, announcement bar and fashion placeholders
- `public/` — original SVG favicon

No environment variables or database are needed for Phase 1. See `.env.example`. PostgreSQL/Prisma and real product catalogue follow in Phase 2; cart/search follow in Phase 3; authentication/checkout in Phase 4; admin, storage, AI jobs, CMS, SEO, and testing in subsequent phases. Do not use this phase to accept real orders. All brand copy, design elements, and artwork are original AURELIA concepts; this project is not affiliated with any reference website.
