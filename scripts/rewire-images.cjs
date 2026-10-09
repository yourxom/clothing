// Re-wire ALL real product images from public/products/ into the DB.
// Safe to re-run: deletes and recreates ProductImage rows for matched products only.
// Run: npm run images:rewire
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMAGES = [
  // ── KURTAS ────────────────────────────────────────────────────────────────
  { slug: "indigo-block-print-straight-kurta",        color: "Indigo",      base: "/products/kurta/", files: ["Indigo Block-Print1.png","Indigo Block-Print2.png","Indigo Block-Print3.png","Indigo Block-Print4.png"] },
  { slug: "chikankari-lucknowi-straight-kurta",        color: "White",       base: "/products/kurta/", files: ["Chikankari Lucknowi1.png","Chikankari Lucknowi2.png","Chikankari Lucknowi3.png","Chikankari Lucknowi4.png"] },
  { slug: "rust-kantha-embroidered-a-line-kurta",      color: "Rust",        base: "/products/kurta/", files: ["Rust Kantha1.png","Rust Kantha2.png","Rust Kantha3.png","Rust Kantha4.png"] },
  { slug: "sage-green-linen-blend-straight-kurta",     color: "Sage Green",  base: "/products/kurta/", files: ["Sage Green Linen1.png","Sage Green Linen2.png","Sage Green Linen3.png","Sage Green Linen4.png"] },
  { slug: "magenta-ikat-relaxed-kurta",                color: "Magenta",     base: "/products/kurta/", files: ["Magenta Ikat1.png","Magenta Ikat2.png","Magenta Ikat3.png","Magenta Ikat4.png"] },
  { slug: "teal-phulkari-embroidered-flared-kurta",    color: "Teal",        base: "/products/kurta/", files: ["Teal Phulkari1.png","Teal Phulkari2.png","Teal Phulkari3.png","Teal Phulkari4.png"] },
  { slug: "earth-rose-cotton-blend-straight-kurta",    color: "Earth Rose",  base: "/products/kurta/", files: ["kurtas-earth-rose-straight-kurta__1.png","kurtas-earth-rose-straight-kurta__2.png","kurtas-earth-rose-straight-kurta__3.png","kurtas-earth-rose-straight-kurta__4.png"] },
  { slug: "olive-viscose-blend-a-line-kurta",          color: "Olive",       base: "/products/kurta/", files: ["kurtas-olive-a-line-kurta__1.png","kurtas-olive-a-line-kurta__2.png","kurtas-olive-a-line-kurta__3.png"] },
  { slug: "dusty-blue-cotton-blend-panelled-kurta",    color: "Dusty Blue",  base: "/products/kurta/", files: ["kurtas-dusty-blue-panelled-kurta__1.png","kurtas-dusty-blue-panelled-kurta__2.png","kurtas-dusty-blue-panelled-kurta__3.png"] },
  { slug: "terracotta-viscose-blend-relaxed-kurta",    color: "Terracotta",  base: "/products/kurta/", files: ["kurtas-terracotta-relaxed-kurta__1.png","kurtas-terracotta-relaxed-kurta__2.png","kurtas-terracotta-relaxed-kurta__3.png"] },
  { slug: "warm-ivory-cotton-blend-embroidered-kurta", color: "Warm Ivory",  base: "/products/kurta/", files: ["kurtas-warm-ivory-embroidered-kurta__1.png","kurtas-warm-ivory-embroidered-kurta__2.png","kurtas-warm-ivory-embroidered-kurta__3.png","kurtas-warm-ivory-embroidered-kurta__4.png"] },
  { slug: "soft-plum-viscose-blend-everyday-kurta",    color: "Soft Plum",   base: "/products/kurta/", files: ["kurtas-soft-plum-everyday-kurta__1.png","kurtas-soft-plum-everyday-kurta__2.png","kurtas-soft-plum-everyday-kurta__3.png"] },

  // ── KURTA SETS ────────────────────────────────────────────────────────────
  { slug: "navy-blue-printed-straight-kurta-palazzo-set",       color: "Navy Blue",  base: "/products/kurta-set/", files: ["Navy Blue Printed Set1.png","Navy Blue Printed Set2.png","Navy Blue Printed Set3.png","Navy Blue Printed Set4.png"] },
  { slug: "old-rose-cotton-straight-suit-set",                   color: "Old Rose",   base: "/products/kurta-set/", files: ["Old Rose Cotton Suit1.png","Old Rose Cotton Suit2.png","Old Rose Cotton Suit3.png","Old Rose Cotton Suit4.png"] },
  { slug: "mustard-floral-anarkali-kurta-churidar-set",          color: "Mustard",    base: "/products/kurta-set/", files: ["Mustard Floral Anarkali1.png","Mustard Floral Anarkali2.png","Mustard Floral Anarkali3.png","Mustard Floral Anarkali4.png"] },
  { slug: "turquoise-viscose-rayon-embroidered-kurta-set",       color: "Turquoise",  base: "/products/kurta-set/", files: ["Turquoise Rayon Embroidered Set1.png","Turquoise Rayon Embroidered Set2.png","Turquoise Rayon Embroidered Set3.png","Turquoise Rayon Embroidered Set4.png"] },
  { slug: "indigo-cotton-hand-embroidered-straight-suit-set",    color: "Indigo",     base: "/products/kurta-set/", files: ["Indigo Hand-Embroidered Suit1.png","Indigo Hand-Embroidered Suit2.png","Indigo Hand-Embroidered Suit3.png","Indigo Hand-Embroidered Suit4.png"] },
  { slug: "rust-angrakha-festive-anarkali-suit-set",             color: "Rust",       base: "/products/kurta-set/", files: ["Rust Angrakha Anarkali1.png","Rust Angrakha Anarkali2.png","Rust Angrakha Anarkali3.png","Rust Angrakha Anarkali4.png"] },

  // ── SUITS ─────────────────────────────────────────────────────────────────
  { slug: "sage-chanderi-silk-suit-set",              color: "Sage",    base: "/products/suits/", files: ["Sage Chanderi Silk1.png","Sage Chanderi Silk2.png","Sage Chanderi Silk3.png","Sage Chanderi Silk4.png"] },
  { slug: "ivory-zardozi-embroidered-suit-set",       color: "Ivory",   base: "/products/suits/", files: ["Ivory Zardozi1.png","Ivory Zardozi2.png","Ivory Zardozi3.png","Ivory Zardozi4.png"] },
  { slug: "lavender-cotton-lucknowi-suit-set",        color: "Lavender",base: "/products/suits/", files: ["Lavender Cotton Lucknowi1.png","Lavender Cotton Lucknowi2.png","Lavender Cotton Lucknowi3.png","Lavender Cotton Lucknowi4.png"] },
  { slug: "wine-banaras-brocade-suit-set",            color: "Wine",    base: "/products/suits/", files: ["Wine Banarasi Brocade1.png","Wine Banarasi Brocade2.png","Wine Banarasi Brocade3.png","Wine Banarasi Brocade4.png"] },
  { slug: "seafoam-cambric-printed-suit-set",         color: "Seafoam", base: "/products/suits/", files: ["Seafoam Cambric Printed1.png","Seafoam Cambric Printed2.png","Seafoam Cambric Printed3.png","Seafoam Cambric Printed4.png"] },
  { slug: "peach-organza-embroidered-suit-set",       color: "Peach",   base: "/products/suits/", files: ["Peach Organza Embroidered1.png","Peach Organza Embroidered2.png","Peach Organza Embroidered3.png","Peach Organza Embroidered4.png"] },

  // ── DRESSES ───────────────────────────────────────────────────────────────
  { slug: "indigo-cotton-floral-tiered-dress",        color: "Indigo",      base: "/products/dresses/", files: ["Indigo Cotton Floral Tiered Dress1.png","Indigo Cotton Floral Tiered Dress2.png","Indigo Cotton Floral Tiered Dress3.png","Indigo Cotton Floral Tiered Dress4.png"] },
  { slug: "rust-cotton-midi-shirt-dress",             color: "Rust",        base: "/products/dresses/", files: ["Rust Cotton Midi Shirt Dress1.png","Rust Cotton Midi Shirt Dress2.png","Rust Cotton Midi Shirt Dress3.png","Rust Cotton Midi Shirt Dress4.png"] },
  { slug: "magenta-rayon-wrap-dress",                 color: "Magenta",     base: "/products/dresses/", files: ["Magenta Rayon Wrap Dress1.png","Magenta Rayon Wrap Dress2.png","Magenta Rayon Wrap Dress3.png","Magenta Rayon Wrap Dress4.png"] },
  { slug: "olive-viscose-printed-pleated-midi",       color: "Olive",       base: "/products/dresses/", files: ["Olive Viscose Printed Pleated Midi1.png","Olive Viscose Printed Pleated Midi2.png","Olive Viscose Printed Pleated Midi3.png","Olive Viscose Printed Pleated Midi4.png"] },
  { slug: "dusty-pink-chanderi-maxi-dress",           color: "Dusty Pink",  base: "/products/dresses/", files: ["Dusty Pink Chanderi Maxi Dress1.png","Dusty Pink Chanderi Maxi Dress2.png","Dusty Pink Chanderi Maxi Dress3.png","Dusty Pink Chanderi Maxi Dress4.png"] },
  { slug: "white-cotton-embroidered-midi-dress",      color: "White",       base: "/products/dresses/", files: ["White Cotton Embroidered Midi Dress1.png","White Cotton Embroidered Midi Dress2.png","White Cotton Embroidered Midi Dress3.png","White Cotton Embroidered Midi Dress4.png"] },
  { slug: "cobalt-blue-smocked-boho-midi-dress",      color: "Cobalt Blue", base: "/products/dresses/", files: ["Cobalt Blue Smocked Boho1.png","Cobalt Blue Smocked Boho2.png","Cobalt Blue Smocked Boho3.png","Cobalt Blue Smocked Boho4.png"] },
  { slug: "neon-yellow-abstract-printed-mini-dress",  color: "Neon Yellow", base: "/products/dresses/", files: ["Neon Yellow Abstract1.png","Neon Yellow Abstract2.png","Neon Yellow Abstract3.png","Neon Yellow Abstract4.png"] },
  { slug: "black-cutout-detail-bodycon-midi-dress",   color: "Black",       base: "/products/dresses/", files: ["Black Cutout Bodycon1.png","Black Cutout Bodycon2.png","Black Cutout Bodycon3.png","Black Cutout Bodycon4.png"] },
  { slug: "mustard-black-colour-block-shift-dress",   color: "Mustard",     base: "/products/dresses/", files: ["Mustard & Black Color-Block1.png","Mustard & Black Color-Block2.png","Mustard & Black Color-Block3.png","Mustard & Black Color-Block4.png"] },
  { slug: "hot-pink-ruffle-wrap-dress",               color: "Hot Pink",    base: "/products/dresses/", files: ["Hot Pink Ruffle Wrap1.png","Hot Pink Ruffle Wrap2.png","Hot Pink Ruffle Wrap3.png","Hot Pink Ruffle Wrap4.png"] },
  { slug: "sage-green-linen-balloon-sleeve-midi-dress",    color: "Sage Green",  base: "/products/dresses/", files: ["Sage Green Linen Balloon-Sleeve1.png","Sage Green Linen Balloon-Sleeve2.png","Sage Green Linen Balloon-Sleeve3.png","Sage Green Linen Balloon-Sleeve4.png"] },
  { slug: "black-rayon-smocked-tiered-midi-dress",    color: "Black",       base: "/products/dresses/", files: ["Black Rayon Smocked Tiered1.png","Black Rayon Smocked Tiered2.png","Black Rayon Smocked Tiered3.png","Black Rayon Smocked Tiered4.png"] },
  { slug: "black-crepe-midi-shirt-dress",             color: "Black",       base: "/products/dresses/", files: ["Black Crepe Midi Shirt1.png","Black Crepe Midi Shirt2.png","Black Crepe Midi Shirt3.png","Black Crepe Midi Shirt4.png"] },

  // ── SAREES ────────────────────────────────────────────────────────────────
  { slug: "ivory-cotton-tant-saree",              color: "Ivory",      base: "/products/sarees/", files: ["Ivory Cotton Tant1.png","Ivory Cotton Tant2.png","Ivory Cotton Tant3.png","Ivory Cotton Tant4.png","Ivory Cotton Tant5.png"] },
  { slug: "teal-banarasi-silk-saree",             color: "Teal",       base: "/products/sarees/", files: ["Teal Banarasi Silk1.png","Teal Banarasi Silk2.png","Teal Banarasi Silk3.png","Teal Banarasi Silk4.png","Teal Banarasi Silk5.png"] },
  { slug: "mustard-tussar-silk-saree",            color: "Mustard",    base: "/products/sarees/", files: ["Mustard Tussar Silk1.png","Mustard Tussar Silk2.png","Mustard Tussar Silk3.png","Mustard Tussar Silk4.png","Mustard Tussar Silk5.png"] },
  { slug: "navy-blue-georgette-printed-saree",    color: "Navy Blue",  base: "/products/sarees/", files: ["Navy Blue Georgette Printed1.png","Navy Blue Georgette Printed2.png","Navy Blue Georgette Printed3.png","Navy Blue Georgette Printed4.png","Navy Blue Georgette Printed5.png"] },
  { slug: "coral-linen-handloom-saree",           color: "Coral",      base: "/products/sarees/", files: ["Coral Linen Handloom1.png","Coral Linen Handloom2.png","Coral Linen Handloom3.png","Coral Linen Handloom4.png","Coral Linen Handloom5.png"] },
  { slug: "burgundy-velvet-embroidered-saree",    color: "Burgundy",   base: "/products/sarees/", files: ["Burgundy Velvet Embroidered1.png","Burgundy Velvet Embroidered2.png","Burgundy Velvet Embroidered3.png","Burgundy Velvet Embroidered4.png","Burgundy Velvet Embroidered5.png"] },

  // ── LEHENGAS ─────────────────────────────────────────────────────────────
  { slug: "blush-pink-mirror-work-lehenga-set",       color: "Blush Pink",    base: "/products/lehengas/", files: ["Blush Pink Mirror Work1.png","Blush Pink Mirror Work2.png","Blush Pink Mirror Work3.png","Blush Pink Mirror Work4.png","Blush Pink Mirror Work5.png"] },
  { slug: "emerald-zardozi-bridal-lehenga",            color: "Emerald",       base: "/products/lehengas/", files: ["Emerald Zardozi Bridal1.png","Emerald Zardozi Bridal2.png","Emerald Zardozi Bridal3.png","Emerald Zardozi Bridal4.png","Emerald Zardozi Bridal5.png"] },
  { slug: "coral-floral-embroidered-lehenga-set",      color: "Coral",         base: "/products/lehengas/", files: ["Coral Floral Embroidered1.png","Coral Floral Embroidered2.png","Coral Floral Embroidered3.png","Coral Floral Embroidered4.png","Coral Floral Embroidered5.png"] },
  { slug: "wine-velvet-lehenga-set",                   color: "Wine",          base: "/products/lehengas/", files: ["Wine Velvet1.png","Wine Velvet2.png","Wine Velvet3.png","Wine Velvet4.png","Wine Velvet5.png"] },
  { slug: "lemon-yellow-thread-work-lehenga-set",      color: "Lemon Yellow",  base: "/products/lehengas/", files: ["Lemon Yellow Thread Work1.png","Lemon Yellow Thread Work2.png","Lemon Yellow Thread Work3.png","Lemon Yellow Thread Work4.png","Lemon Yellow Thread Work5.png"] },
  { slug: "powder-blue-organza-lehenga-set",           color: "Powder Blue",   base: "/products/lehengas/", files: ["Powder Blue Organza1.png","Powder Blue Organza2.png","Powder Blue Organza3.png","Powder Blue Organza4.png","Powder Blue Organza5.png"] },

  // ── BOTTOM WEAR ───────────────────────────────────────────────────────────
  { slug: "indigo-cotton-straight-pants",           color: "Indigo",   base: "/products/bottom-wear/", files: ["Indigo Cotton Straight Pants1.png","Indigo Cotton Straight Pants2.png","Indigo Cotton Straight Pants3.png","Indigo Cotton Straight Pants4.png"] },
  { slug: "rust-wide-leg-palazzos",                 color: "Rust",     base: "/products/bottom-wear/", files: ["Rust Viscose Wide-Leg Palazzos1.png","Rust Viscose Wide-Leg Palazzos2.png","Rust Viscose Wide-Leg Palazzos3.png","Rust Viscose Wide-Leg Palazzos4.png"] },
  { slug: "white-cotton-sharara-pants",             color: "White",    base: "/products/bottom-wear/", files: ["White Cotton Sharara Pants1.png","White Cotton Sharara Pants2.png","White Cotton Sharara Pants3.png","White Cotton Sharara Pants4.png"] },
  { slug: "lavender-cotton-flared-skirt",           color: "Lavender", base: "/products/bottom-wear/", files: ["Lavender Cotton Flared Skirt1.png","Lavender Cotton Flared Skirt2.png","Lavender Cotton Flared Skirt3.png","Lavender Cotton Flared Skirt4.png"] },
  { slug: "mustard-silk-blend-cigarette-pants",     color: "Mustard",  base: "/products/bottom-wear/", files: ["Mustard Silk Blend Cigarette Pants1.png","Mustard Silk Blend Cigarette Pants2.png","Mustard Silk Blend Cigarette Pants3.png","Mustard Silk Blend Cigarette Pants4.png"] },
  { slug: "black-rayon-dhoti-pants",                color: "Black",    base: "/products/bottom-wear/", files: ["Black Rayon Dhoti Pants1.png","Black Rayon Dhoti Pants2.png","Black Rayon Dhoti Pants3.png","Black Rayon Dhoti Pants4.png"] },
  { slug: "black-silk-blend-flared-skirt",          color: "Black",    base: "/products/bottom-wear/", files: ["Black Silk Blend Flared Skirt1.png","Black Silk Blend Flared Skirt2.png","Black Silk Blend Flared Skirt3.png","Black Silk Blend Flared Skirt4.png"] },
  { slug: "black-straight-cut-palazzos",                    color: "Black",    base: "/products/bottom-wear/", files: ["Black Viscose Straight-Cut Palazzos1.png","Black Viscose Straight-Cut Palazzos2.png","Black Viscose Straight-Cut Palazzos3.png","Black Viscose Straight-Cut Palazzos4.png"] },

  // ── CO-ORD SETS ───────────────────────────────────────────────────────────
  { slug: "sage-linen-shirt-wide-leg-set",                          color: "Sage",       base: "/products/co-ords/", files: ["Sage Linen Shirt & Wide-Leg Set1.png","Sage Linen Shirt & Wide-Leg Set2.png","Sage Linen Shirt & Wide-Leg Set3.png","Sage Linen Shirt & Wide-Leg Set4.png"] },
  { slug: "ivory-schiffli-co-ord-set",                              color: "Ivory",      base: "/products/co-ords/", files: ["Ivory Soft Chiffon Co-ord Set1.png","Ivory Soft Chiffon Co-ord Set2.png","Ivory Soft Chiffon Co-ord Set3.png","Ivory Soft Chiffon Co-ord Set4.png"] },
  { slug: "coral-cotton-block-print-co-ord-set",                    color: "Coral",      base: "/products/co-ords/", files: ["Coral Cotton Block-Print Co-ord Set1.png","Coral Cotton Block-Print Co-ord Set2.png","Coral Cotton Block-Print Co-ord Set3.png","Coral Cotton Block-Print Co-ord Set4.png"] },
  { slug: "navy-striped-rayon-tunic-palazzo-set",               color: "Navy Blue",  base: "/products/co-ords/", files: ["Navy Striped Rayon Tunic & Palazzo Set1.png","Navy Striped Rayon Tunic & Palazzo Set2.png","Navy Striped Rayon Tunic & Palazzo Set3.png","Navy Striped Rayon Tunic & Palazzo Set4.png"] },
  { slug: "teal-silk-blend-crop-top-flared-skirt-set",          color: "Teal",       base: "/products/co-ords/", files: ["Teal Silk Blend Crop Top & Flared Skirt Set1.png","Teal Silk Blend Crop Top & Flared Skirt Set2.png","Teal Silk Blend Crop Top & Flared Skirt Set3.png","Teal Silk Blend Crop Top & Flared Skirt Set4.png"] },
  { slug: "black-linen-co-ord-set",                                 color: "Black",      base: "/products/co-ords/", files: ["Black Linen Co-ord Set1.png","Black Linen Co-ord Set2.png","Black Linen Co-ord Set3.png","Black Linen Co-ord Set4.png"] },
  { slug: "rust-embroidered-angrakha-top-pant-set",                 color: "Rust",       base: "/products/co-ords/", files: ["Rust Cotton Blend Embroidered Angrakha Top & Pant Set1.png","Rust Cotton Blend Embroidered Angrakha Top & Pant Set2.png","Rust Cotton Blend Embroidered Angrakha Top & Pant Set3.png","Rust Cotton Blend Embroidered Angrakha Top & Pant Set4.png"] },
  { slug: "black-embroidered-crop-top-palazzo-set",                 color: "Black",      base: "/products/co-ords/", files: ["Black Cotton Blend Embroidered Crop Top & Palazzo Set1.png","Black Cotton Blend Embroidered Crop Top & Palazzo Set2.png","Black Cotton Blend Embroidered Crop Top & Palazzo Set3.png","Black Cotton Blend Embroidered Crop Top & Palazzo Set4.png"] },

  // ── WHITE LEHENGA ────────────────────────────────────────────────────────
  { slug: "white-pearl-bridal-lehenga-set",     color: "White", base: "/products/lehengas/",
    files: ["White Pearl Bridal Lehenga1.png","White Pearl Bridal Lehenga2.png","White Pearl Bridal Lehenga3.png","White Pearl Bridal Lehenga4.png","White Pearl Bridal Lehenga5.png"] },

  // ── BLACK SAREE ───────────────────────────────────────────────────────────
  { slug: "black-kanjivaram-silk-saree",        color: "Black", base: "/products/sarees/",
    files: ["Black Kanjivaram Silk Saree1.png","Black Kanjivaram Silk Saree2.png","Black Kanjivaram Silk Saree3.png","Black Kanjivaram Silk Saree4.png","Black Kanjivaram Silk Saree5.png"] },

  // ── TOPS & SHIRTS ─────────────────────────────────────────────────────────
  { slug: "ivory-schiffli-embroidered-top",         color: "Ivory",       base: "/products/tops-shirts/", files: ["Ivory Schiffli Embroidered Top1.png","Ivory Schiffli Embroidered Top2.png","Ivory Schiffli Embroidered Top3.png","Ivory Schiffli Embroidered Top4.png"] },
  { slug: "sage-linen-oversized-shirt",             color: "Sage",        base: "/products/tops-shirts/", files: ["Sage Linen Oversized Shirt1.png","Sage Linen Oversized Shirt2.png","Sage Linen Oversized Shirt3.png","Sage Linen Oversized Shirt4.png"] },
  { slug: "black-crop-tie-front-top",               color: "Black",       base: "/products/tops-shirts/", files: ["Black Crop Tie-Front Top1.png","Black Crop Tie-Front Top2.png","Black Crop Tie-Front Top3.png","Black Crop Tie-Front Top4.png"] },
  { slug: "rust-bandhani-peplum-top",               color: "Rust",        base: "/products/tops-shirts/", files: ["Rust Bandhani Peplum Top1.png","Rust Bandhani Peplum Top2.png","Rust Bandhani Peplum Top3.png","Rust Bandhani Peplum Top4.png"] },
  { slug: "powder-blue-cotton-pintuck-shirt",       color: "Powder Blue", base: "/products/tops-shirts/", files: ["Powder Blue Cotton Pintuck Shirt1.png","Powder Blue Cotton Pintuck Shirt2.png","Powder Blue Cotton Pintuck Shirt3.png","Powder Blue Cotton Pintuck Shirt4.png"] },
  { slug: "mustard-block-print-kaftan-top",         color: "Mustard",     base: "/products/tops-shirts/", files: ["Mustard Block-Print Kaftan Top1.png","Mustard Block-Print Kaftan Top2.png","Mustard Block-Print Kaftan Top3.png","Mustard Block-Print Kaftan Top4.png"] },
];

async function main() {
  let wired = 0, skipped = 0;

  for (const entry of IMAGES) {
    const product = await prisma.product.findUnique({
      where: { slug: entry.slug }, select: { id: true, name: true },
    });

    if (!product) {
      console.log(`  ✗  PRODUCT NOT FOUND: ${entry.slug}`);
      skipped++;
      continue;
    }

    // Delete all existing images for this product then recreate.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });

    for (let i = 0; i < entry.files.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url:       entry.base + entry.files[i],
          type:      "MODEL",
          altText:   `${product.name} — ${entry.color}`,
          color:     entry.color,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
    }

    console.log(`  ✔  ${product.name}  (${entry.files.length} images)`);
    wired++;
  }

  console.log(`\nDone — ${wired} products wired (${skipped} not found in DB).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
