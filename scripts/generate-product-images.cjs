#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * AI product-image generator for AURELIA.
 *
 *   PRIMARY  →  Pollinations.ai  (gpt-image-2)  — best quality, free tier
 *   FALLBACK →  Hugging Face     (FLUX.1-schnell) — if POLLINATIONS_API_KEY not set
 *
 *   Prompts: Gemini text API (free) when GEMINI_API_KEY is set,
 *            or built-in template (no key needed at all).
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 *   Get a FREE Pollinations key:  https://enter.pollinations.ai/keys
 *   Add to .env:
 *       POLLINATIONS_API_KEY="your-key"
 *       GEMINI_API_KEY=""   # optional — richer prompts when set
 *
 * ── Usage (from clothing/clothing/) ──────────────────────────────────────────
 *   node scripts/generate-product-images.cjs --dry --limit 3  # see prompts first
 *   node scripts/generate-product-images.cjs --limit 3        # test 3 products
 *   node scripts/generate-product-images.cjs                  # ALL products
 *   node scripts/generate-product-images.cjs --slug <slug>    # one product
 *   node scripts/generate-product-images.cjs --force          # regenerate existing
 *   node scripts/generate-product-images.cjs --all-colours    # every colourway
 *
 * Resumable: already-saved files are skipped (unless --force).
 * Saved to:  public/products/<slug>__<colour>.jpg
 * DB updated automatically (colour-tagged, 3:4 ready for the storefront).
 */
const fs   = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const prisma = new PrismaClient();

// ── Keys & endpoints ──────────────────────────────────────────────────────────
const POLL_KEY   = process.env.POLLINATIONS_API_KEY || "";
const HF_KEY     = process.env.HF_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

const OUT_DIR = path.join(__dirname, "..", "public", "products");

const POLL_ENDPOINT = "https://gen.pollinations.ai/v1/images/generations";
const HF_ENDPOINT   = "https://router.huggingface.co/nscale/v1/images/generations";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta";
const TEXT_MODEL    = "gemini-2.0-flash";

// ── CLI flags ─────────────────────────────────────────────────────────────────
function parseFlags(argv) {
  const f = { limit: Infinity, slug: null, dry: false, force: false, allColours: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if      (a === "--limit")    f.limit      = parseInt(argv[++i]) || Infinity;
    else if (a === "--slug")     f.slug       = argv[++i];
    else if (a === "--dry")      f.dry        = true;
    else if (a === "--force")    f.force      = true;
    else if (a === "--all-colours" || a === "--all-colors") f.allColours = true;
  }
  return f;
}
const opts = parseFlags(process.argv.slice(2));

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ── Garment / setting / pose tables ──────────────────────────────────────────
const GARMENT = {
  "kurtas":       "straight-cut kurta", "kurta-sets": "kurta with matching bottoms",
  "suits":        "three-piece suit set", "dresses": "midi dress",
  "sarees":       "six-yard saree", "lehengas": "festive lehenga skirt and blouse",
  "bottom-wear":  "wide-leg trousers", "co-ord-sets": "co-ordinated top and trousers set",
  "dupattas":     "long dupatta scarf",
};
const SETTING = {
  "kurtas":       "soft seamless cream studio backdrop, warm window light",
  "kurta-sets":   "minimal off-white studio backdrop, gentle diffused light",
  "suits":        "light grey seamless studio backdrop, soft fill light",
  "dresses":      "sunlit white wall outdoors, golden-hour daylight",
  "sarees":       "warm cream textured wall, soft directional studio light",
  "lehengas":     "blurred warm golden bokeh background, festive mood",
  "bottom-wear":  "light wooden floor, clean white studio backdrop",
  "co-ord-sets":  "bright airy studio, natural daylight from side window",
  "dupattas":     "minimalist warm backdrop, soft natural light",
};
const POSE = {
  "kurtas":       "relaxed standing three-quarter pose, one hand at side, confident gaze",
  "kurta-sets":   "natural walk pose mid-step showing both pieces, slight smile",
  "suits":        "elegant standing pose, hands loosely clasped, poised expression",
  "dresses":      "relaxed editorial stance, weight on one leg, hair gently tousled",
  "sarees":       "graceful standing pose, pallu draped over shoulder and visible, hands soft",
  "lehengas":     "gentle twirl pose showing the flare of the skirt, joyful expression",
  "bottom-wear":  "full-length standing pose showing trouser silhouette, crossed arms",
  "co-ord-sets":  "casual standing with one hand in pocket, relaxed expression",
  "dupattas":     "three-quarter pose with dupatta draped over shoulder and flowing",
};

// ── Prompt builders ───────────────────────────────────────────────────────────
function templatePrompt({ name, categorySlug, colour, fabric }) {
  const garment = GARMENT[categorySlug] || "Indian outfit";
  const setting = SETTING[categorySlug] || "soft seamless studio backdrop, warm natural light";
  const pose    = POSE[categorySlug]    || "natural standing pose, relaxed expression";
  return [
    `A high-resolution, hyper-realistic fashion e-commerce photograph of a young Indian female model`,
    `wearing a ${colour.toLowerCase()} ${fabric.toLowerCase()} ${garment} called "${name}".`,
    `She stands in a ${pose}. Setting: ${setting}.`,
    `Shot on a full-frame DSLR with an 85mm prime lens at f/1.8, shallow depth of field,`,
    `true-to-life ${colour.toLowerCase()} colour with realistic fabric weave and natural drape.`,
    `Natural skin texture, soft catchlights in the eyes, realistic hands.`,
    `Full-length portrait, 3:4 aspect ratio, model perfectly centered with headroom,`,
    `entire ${garment} visible from shoulder to hem, nothing cropped.`,
    `Authentic fashion catalogue photograph — photorealistic, not CGI, not an illustration, not 3D.`,
    `No text overlay, no watermark, no logo, no borders.`,
  ].join(" ");
}

async function geminiPrompt({ name, categorySlug, colour, fabric }) {
  const instruction =
`You are an art director for AURELIA, a contemporary Indian womenswear brand.
Write ONE detailed, vivid image-generation prompt (4-6 sentences, no preamble) for:
Product: "${name}", Garment: ${GARMENT[categorySlug]||"outfit"}, Colour: ${colour}, Fabric: ${fabric}.
Setting: ${SETTING[categorySlug]||"studio"}. Pose: ${POSE[categorySlug]||"standing"}.
Rules: young Indian female model, natural skin, realistic hands, DSLR 85mm f/1.8, shallow DOF,
full-length 3:4 portrait, model centred, whole garment visible, photorealistic not CGI.
End with: "No text, no watermark, no logo, no borders."
Return only the prompt text.`;
  const res = await fetch(`${GEMINI_BASE}/models/${TEXT_MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: instruction }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ").trim();
  if (!text) throw new Error("Gemini returned empty response");
  return text + " Photorealistic fashion catalogue photograph, 3:4 portrait.";
}

// ── Pollinations gpt-image-2 generator ───────────────────────────────────────
async function generateWithPollinations(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(POLL_ENDPOINT, {
      method: "POST",
      headers: { "Authorization": `Bearer ${POLL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model:  "openai/gpt-image-2",
        prompt,
        n: 1,
        size: "1024x1536",   // 2:3 portrait (closest available to 3:4)
        quality: "medium",   // medium = good quality + faster + costs less
      }),
    });

    if (res.status === 429) {
      const wait = (attempt + 1) * 12;
      console.log(`   Rate limited, waiting ${wait}s… (${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pollinations ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    const b64  = json?.data?.[0]?.b64_json;
    if (b64) return Buffer.from(b64, "base64");
    const url  = json?.data?.[0]?.url;
    if (url) {
      const r = await fetch(url);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 5000) return buf;
    }
    throw new Error(`Unexpected response: ${JSON.stringify(json).slice(0, 200)}`);
  }
  throw new Error("Failed after max retries");
}

// ── HuggingFace FLUX fallback ─────────────────────────────────────────────────
async function generateWithFlux(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: { "Authorization": `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "black-forest-labs/FLUX.1-schnell", prompt, n: 1, size: "768x1024" }),
    });
    if (res.status === 429 || res.status === 503) {
      const wait = (attempt + 1) * 15;
      console.log(`   HF rate-limited, waiting ${wait}s… (${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`HF API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const b64  = json?.data?.[0]?.b64_json;
    if (b64) return Buffer.from(b64, "base64");
    const url  = json?.data?.[0]?.url;
    if (url) {
      const r = await fetch(url);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 5000) return buf;
    }
    throw new Error(`Unexpected HF response: ${JSON.stringify(json).slice(0, 200)}`);
  }
  throw new Error("HF failed after max retries");
}

async function generateImage(prompt) {
  if (POLL_KEY) return generateWithPollinations(prompt);
  if (HF_KEY)   return generateWithFlux(prompt);
  throw new Error("No API key set. Add POLLINATIONS_API_KEY to .env");
}

// ── DB upsert ─────────────────────────────────────────────────────────────────
async function upsertImage(productId, url, productName, colour, sortIndex) {
  const existing = await prisma.productImage.findFirst({ where: { productId, url }, select: { id: true } });
  const data = { color: colour, altText: `${productName} — ${colour}`, type: "MODEL", isPrimary: sortIndex === 0, sortOrder: sortIndex };
  if (existing) await prisma.productImage.update({ where: { id: existing.id }, data });
  else           await prisma.productImage.create({ data: { productId, url, ...data } });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const provider = POLL_KEY ? "Pollinations (gpt-image-2)" : HF_KEY ? "HuggingFace (FLUX.1-schnell)" : null;

  if (!opts.dry && !provider) {
    console.error([
      "",
      "✖  No API key found.",
      "   Get a FREE Pollinations key: https://enter.pollinations.ai/keys",
      "   Add to .env:  POLLINATIONS_API_KEY=\"your-key-here\"",
    ].join("\n"));
    process.exit(1);
  }

  console.log(`\n=== AURELIA image generator ===`);
  console.log(`   Model   : ${provider || "(dry run — no model used)"}`);
  console.log(`   Prompts : ${GEMINI_KEY ? "Gemini AI" : "built-in template"}`);
  console.log(`   Mode    : ${opts.dry ? "DRY RUN (no images)" : "GENERATE"}`);
  console.log(`   Output  : public/products/\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const where = { published: true, ...(opts.slug ? { slug: opts.slug } : {}) };
  const products = await prisma.product.findMany({ where, include: { category: true, variants: true }, orderBy: { createdAt: "asc" } });
  if (!products.length) { console.error("✖ No matching published products. Run `npm run db:seed` first."); process.exit(1); }

  let generated = 0, skipped = 0, failed = 0, processed = 0;

  for (const product of products) {
    if (processed >= opts.limit) break;
    processed++;

    const colours = opts.allColours ? [...new Set(product.variants.map(v => v.color))] : [product.color];

    for (const [ci, colour] of colours.entries()) {
      const fileName = `${product.slug}__${slugify(colour)}.jpg`;
      const filePath = path.join(OUT_DIR, fileName);
      const publicUrl = `/products/${fileName}`;

      if (!opts.force && fs.existsSync(filePath)) {
        console.log(`•  skip   ${fileName}`);
        skipped++;
        if (!opts.dry) await upsertImage(product.id, publicUrl, product.name, colour, ci);
        continue;
      }

      console.log(`▸  ${product.name}  —  ${colour}`);
      try {
        // 1. Build prompt
        let prompt;
        if (GEMINI_KEY) {
          try {
            prompt = await geminiPrompt({ name: product.name, categorySlug: product.category.slug, colour, fabric: product.fabric });
            console.log(`   Prompt (Gemini): ${prompt.slice(0, 100)}…`);
          } catch (e) {
            console.log(`   Gemini failed (${e.message}), using template.`);
            prompt = templatePrompt({ name: product.name, categorySlug: product.category.slug, colour, fabric: product.fabric });
          }
        } else {
          prompt = templatePrompt({ name: product.name, categorySlug: product.category.slug, colour, fabric: product.fabric });
          console.log(`   Prompt: ${prompt.slice(0, 100)}…`);
        }

        if (opts.dry) { console.log(`   [DRY] Would save ${fileName}\n`); continue; }

        // 2. Generate
        const bytes = await generateImage(prompt);
        fs.writeFileSync(filePath, bytes);
        await upsertImage(product.id, publicUrl, product.name, colour, ci);
        console.log(`   ✔  saved ${fileName}  (${(bytes.length / 1024).toFixed(0)} KB)\n`);
        generated++;

        // Brief pause every 5 images — polite to the free tier
        if (generated % 5 === 0) await new Promise(r => setTimeout(r, 3000));

      } catch (e) {
        console.error(`   ✖  ${colour}: ${e.message}\n`);
        failed++;
      }
    }
  }

  console.log(`\n=== ${opts.dry ? "DRY RUN — no images created" : "DONE"} ===`);
  if (!opts.dry) console.log(`Generated: ${generated}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
}

main()
  .catch((e) => { console.error("✖ Fatal:", e.message); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
