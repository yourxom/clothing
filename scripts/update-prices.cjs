// Direct price update — no re-seed needed.
// price == mrp  →  no discount badge shown (full price)
// price <  mrp  →  discount badge shown
// Run: node scripts/update-prices.cjs
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// price in ₹, mrp in ₹  (converted to paise when writing)
// Items marked "// FULL PRICE" have price == mrp → no discount
const PRICES = [
  // ── KURTAS (₹800–1500) ───────────────────────────────────────────────────
  { sku: 'AUR-01-01', price:  1250, mrp:  1999 },          // discounted
  { sku: 'AUR-01-02', price:  1399, mrp:  1399 },          // FULL PRICE
  { sku: 'AUR-01-03', price:  1099, mrp:  1699 },          // discounted
  { sku: 'AUR-01-04', price:   949, mrp:   949 },          // FULL PRICE
  { sku: 'AUR-01-05', price:   875, mrp:  1399 },          // discounted
  { sku: 'AUR-01-06', price:  1450, mrp:  2299 },          // discounted
  { sku: 'AUR-01-07', price:  1049, mrp:  1049 },          // FULL PRICE
  { sku: 'AUR-01-08', price:   899, mrp:  1399 },          // discounted
  { sku: 'AUR-01-09', price:  1149, mrp:  1799 },          // discounted
  { sku: 'AUR-01-10', price:   825, mrp:   825 },          // FULL PRICE
  { sku: 'AUR-01-11', price:  1349, mrp:  2099 },          // discounted
  { sku: 'AUR-01-12', price:   799, mrp:  1249 },          // discounted
  { sku: 'AUR-01-13', price:  1199, mrp:  1849 },          // discounted
  { sku: 'AUR-01-14', price:   999, mrp:   999 },          // FULL PRICE

  // ── KURTA SETS (₹1000–3000) ──────────────────────────────────────────────
  { sku: 'AUR-02-01', price:  1499, mrp:  1499 },          // FULL PRICE
  { sku: 'AUR-02-02', price:  2499, mrp:  3999 },          // discounted
  { sku: 'AUR-02-03', price:  2799, mrp:  4499 },          // discounted
  { sku: 'AUR-02-04', price:  1899, mrp:  1899 },          // FULL PRICE
  { sku: 'AUR-02-05', price:  2999, mrp:  4799 },          // discounted
  { sku: 'AUR-02-06', price:  2599, mrp:  4199 },          // discounted

  // ── SUITS (₹1000–5000) ───────────────────────────────────────────────────
  { sku: 'AUR-03-01', price:  3999, mrp:  6499 },          // discounted
  { sku: 'AUR-03-02', price:  4999, mrp:  7999 },          // discounted
  { sku: 'AUR-03-03', price:  2499, mrp:  2499 },          // FULL PRICE
  { sku: 'AUR-03-04', price:  4799, mrp:  7499 },          // discounted
  { sku: 'AUR-03-05', price:  1799, mrp:  1799 },          // FULL PRICE
  { sku: 'AUR-03-06', price:  4499, mrp:  7199 },          // discounted
  { sku: 'AUR-03-07', price:  3799, mrp:  6199 },          // discounted
  { sku: 'AUR-03-08', price:  4699, mrp:  4699 },          // FULL PRICE

  // ── DRESSES (₹2000–5000) ─────────────────────────────────────────────────
  { sku: 'AUR-04-01', price:  2499, mrp:  3999 },          // discounted
  { sku: 'AUR-04-02', price:  2199, mrp:  2199 },          // FULL PRICE
  { sku: 'AUR-04-03', price:  2699, mrp:  4299 },          // discounted
  { sku: 'AUR-04-04', price:  2299, mrp:  2299 },          // FULL PRICE
  { sku: 'AUR-04-05', price:  3999, mrp:  6499 },          // discounted
  { sku: 'AUR-04-06', price:  2999, mrp:  4799 },          // discounted
  { sku: 'AUR-04-07', price:  2399, mrp:  3799 },          // discounted
  { sku: 'AUR-04-08', price:  2099, mrp:  2099 },          // FULL PRICE
  { sku: 'AUR-04-09', price:  2799, mrp:  4499 },          // discounted
  { sku: 'AUR-04-10', price:  2599, mrp:  4199 },          // discounted
  { sku: 'AUR-04-11', price:  3199, mrp:  5199 },          // discounted
  { sku: 'AUR-04-12', price:  2899, mrp:  2899 },          // FULL PRICE
  { sku: 'AUR-04-13', price:  2199, mrp:  3499 },          // discounted
  { sku: 'AUR-04-14', price:  2899, mrp:  4599 },          // discounted

  // ── SAREES (₹5000–15000) ─────────────────────────────────────────────────
  { sku: 'AUR-05-01', price:  8999, mrp: 14999 },          // discounted
  { sku: 'AUR-05-02', price:  5499, mrp:  5499 },          // FULL PRICE
  { sku: 'AUR-05-03', price:  6499, mrp: 10999 },          // discounted
  { sku: 'AUR-05-04', price:  7999, mrp: 12999 },          // discounted
  { sku: 'AUR-05-05', price:  5199, mrp:  5199 },          // FULL PRICE
  { sku: 'AUR-05-06', price: 11999, mrp: 19999 },          // discounted
  { sku: 'AUR-05-07', price: 14499, mrp: 23999 },          // discounted

  // ── LEHENGAS (₹8000–15000) ───────────────────────────────────────────────
  { sku: 'AUR-06-01', price: 11999, mrp: 19999 },          // discounted
  { sku: 'AUR-06-02', price: 14999, mrp: 24999 },          // discounted
  { sku: 'AUR-06-03', price:  8999, mrp:  8999 },          // FULL PRICE
  { sku: 'AUR-06-04', price:  9999, mrp: 16999 },          // discounted
  { sku: 'AUR-06-05', price:  8499, mrp:  8499 },          // FULL PRICE
  { sku: 'AUR-06-06', price: 10999, mrp: 17999 },          // discounted
  { sku: 'AUR-06-07', price: 14999, mrp: 24999 },          // discounted

  // ── BOTTOM WEAR (₹800–1200) ──────────────────────────────────────────────
  { sku: 'AUR-07-01', price:   899, mrp:   899 },          // FULL PRICE
  { sku: 'AUR-07-02', price:  1099, mrp:  1699 },          // discounted
  { sku: 'AUR-07-03', price:  1199, mrp:  1899 },          // discounted
  { sku: 'AUR-07-04', price:   999, mrp:   999 },          // FULL PRICE
  { sku: 'AUR-07-05', price:  1149, mrp:  1849 },          // discounted
  { sku: 'AUR-07-06', price:   849, mrp:   849 },          // FULL PRICE
  { sku: 'AUR-07-07', price:   949, mrp:  1499 },          // discounted
  { sku: 'AUR-07-08', price:  1099, mrp:  1749 },          // discounted

  // ── CO-ORD SETS (₹1500–3000) ─────────────────────────────────────────────
  { sku: 'AUR-08-01', price:  2499, mrp:  3999 },          // discounted
  { sku: 'AUR-08-02', price:  1999, mrp:  1999 },          // FULL PRICE
  { sku: 'AUR-08-03', price:  2799, mrp:  4499 },          // discounted
  { sku: 'AUR-08-04', price:  1649, mrp:  1649 },          // FULL PRICE
  { sku: 'AUR-08-05', price:  2999, mrp:  4799 },          // discounted
  { sku: 'AUR-08-06', price:  2599, mrp:  4199 },          // discounted
  { sku: 'AUR-08-07', price:  1899, mrp:  1899 },          // FULL PRICE
  { sku: 'AUR-08-08', price:  2799, mrp:  4499 },          // discounted

  // ── DUPATTAS (₹500–800) ──────────────────────────────────────────────────
  { sku: 'AUR-09-01', price:   649, mrp:   649 },          // FULL PRICE
  { sku: 'AUR-09-02', price:   749, mrp:  1199 },          // discounted
  { sku: 'AUR-09-03', price:   599, mrp:   599 },          // FULL PRICE
  { sku: 'AUR-09-04', price:   799, mrp:  1299 },          // discounted
  { sku: 'AUR-09-05', price:   529, mrp:   529 },          // FULL PRICE
  { sku: 'AUR-09-06', price:   699, mrp:  1099 },          // discounted

  // ── TOPS & SHIRTS (₹1000–3000) ───────────────────────────────────────────
  { sku: 'AUR-10-01', price:  1299, mrp:  2099 },          // discounted
  { sku: 'AUR-10-02', price:  1499, mrp:  2399 },          // discounted
  { sku: 'AUR-10-03', price:   999, mrp:   999 },          // FULL PRICE
  { sku: 'AUR-10-04', price:  1399, mrp:  2199 },          // discounted
  { sku: 'AUR-10-05', price:  1149, mrp:  1149 },          // FULL PRICE
  { sku: 'AUR-10-06', price:  1099, mrp:  1749 },          // discounted
];


async function main() {
  let updated = 0, skipped = 0;
  for (const p of PRICES) {
    const result = await prisma.product.updateMany({
      where: { sku: p.sku },
      data:  { price: p.price * 100, mrp: p.mrp * 100 },
    });
    if (result.count > 0) {
      console.log(`  ✔  ${p.sku}  ₹${p.price} / MRP ₹${p.mrp}`);
      updated++;
    } else {
      console.log(`  ✗  NOT FOUND: ${p.sku}`);
      skipped++;
    }
  }
  console.log(`\nDone — ${updated} updated, ${skipped} not found.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
