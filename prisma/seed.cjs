// AURELIA storefront — full catalogue seed with real, diverse, market-accurate products.
// Inspired by product conventions from Biba, Libas, W for Woman, Anouk, Sangria, Fabindia.
// Safe to re-run: uses upsert throughout.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const colorCode = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
const placeholderImage = (slug, color) =>
  `https://picsum.photos/seed/aurelia-${slugify(slug)}-${slugify(color)}/900/1200`;

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'kurtas',      name: 'Kurtas',       description: 'Everyday ease in thoughtful silhouettes.',              sort: 0 },
  { slug: 'kurta-sets',  name: 'Kurta Sets',   description: 'Considered pairings for every plan.',                  sort: 1 },
  { slug: 'suits',       name: 'Suits',        description: 'Elegant ensembles with modern ease.',                  sort: 2 },
  { slug: 'dresses',     name: 'Dresses',      description: 'One-piece dressing with room to move.',                sort: 3 },
  { slug: 'sarees',      name: 'Sarees',       description: 'A timeless drape, a fresh perspective.',              sort: 4 },
  { slug: 'lehengas',    name: 'Lehengas',     description: 'Celebrate in your own way.',                          sort: 5 },
  { slug: 'bottom-wear', name: 'Bottom Wear',  description: 'The foundations of a versatile wardrobe.',            sort: 6 },
  { slug: 'co-ord-sets', name: 'Co-ord Sets',  description: 'Easy pieces made to work together.',                  sort: 7 },
  { slug: 'dupattas',    name: 'Dupattas',     description: 'A finishing touch with personality.',                  sort: 8 },
  { slug: 'tops-shirts', name: 'Tops & Shirts', description: 'Standalone tops and shirts for every occasion.',         sort: 9 },
];

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
// price/mrp in rupees (converted to paise in seed). Colors array → first is primary.
const PRODUCTS = [

  // ── KURTAS (6) ──────────────────────────────────────────────────────────────
  {
    category: 'kurtas', sku: 'AUR-01-01',
    name: 'Indigo Block-Print Straight Kurta',
    color: 'Indigo', fabric: 'Pure Cotton', tone: 'blue',
    price: 1250, mrp: 1999,
    colors: ['Indigo', 'Rust', 'Forest Green'],
    description: 'Hand block-printed in the classic bagru tradition on breathable pure cotton. The indigo dye deepens with every wash, making this kurta more characterful over time. Straight cut, side slits, and a subtle pintuck yoke. A wardrobe anchor that works from desk to dinner.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-02',
    name: 'Chikankari Lucknowi Straight Kurta',
    color: 'White', fabric: 'Georgette', tone: 'sand',
    price: 1399, mrp: 1399,
    colors: ['White'],
    description: 'Delicate chikankari embroidery — the centuries-old craft of Lucknow — adorns the neckline, yoke, and cuffs of this georgette straight kurta. Shadow work and phanda stitches catch the light beautifully. Wear it with cigarette pants or palazzos for a look that feels effortlessly polished.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-03',
    name: 'Rust Kantha Embroidered A-Line Kurta',
    color: 'Rust', fabric: 'Mul Cotton', tone: 'clay',
    price: 1099, mrp: 1699,
    colors: ['Rust'],
    description: 'Running kantha stitches trace geometric motifs across the front yoke of this rust mul cotton A-line kurta. The soft, open weave of mul cotton keeps things light and breathable. Cut with a gently flared hem that sits beautifully whether you are at a weekend brunch or a day out.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-04',
    name: 'Sage Green Linen Blend Straight Kurta',
    color: 'Sage Green', fabric: 'Linen blend', tone: 'olive',
    price: 949, mrp: 949,
    colors: ['Sage Green', 'Dusty Rose', 'Slate Blue'],
    description: 'A clean, minimal straight kurta cut from linen blend fabric that keeps you cool on the warmest days. The sage green is the kind of muted, sophisticated tone that pairs with everything. Side slits, a mandarin collar, and three-quarter sleeves. Simple, considered, lasting.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-05',
    name: 'Magenta Ikat Relaxed Kurta',
    color: 'Magenta', fabric: 'Viscose', tone: 'plum',
    price: 875, mrp: 1399,
    colors: ['Magenta'],
    description: 'Ikat weaving creates the signature blurred geometric pattern across this relaxed viscose kurta. Magenta is bold but the loose silhouette and easy length keep it wearable for everyday. Drop shoulders, a V-neckline, and a straight hem. Throw it on with jeans and feel instantly put together.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-06',
    name: 'Teal Phulkari Embroidered Flared Kurta',
    color: 'Teal', fabric: 'Cotton blend', tone: 'blue',
    price: 1450, mrp: 2299,
    colors: ['Teal'],
    description: 'Vibrant phulkari embroidery in gold and orange silks covers the yoke and sleeve cuffs of this teal cotton blend flared kurta. Phulkari — meaning flower work — is a Punjab heritage craft, and every piece is unique. The flared silhouette adds movement, making this ideal for celebrations.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-07',
    name: 'Earth Rose Cotton Blend Straight Kurta',
    color: 'Earth Rose', fabric: 'Cotton blend', tone: 'rose',
    price: 1049, mrp: 1049,
    colors: ['Earth Rose', 'Dusty Blue', 'Warm Ivory'],
    description: 'A versatile straight-cut kurta in a warm, muted Earth Rose shade — that perfect dusty pink-brown tone that flatters every skin tone. Cut from soft cotton blend fabric with subtle pintuck detailing at the yoke and three-quarter sleeves. Side slits give ease of movement. Pairs beautifully with both straight pants and palazzos.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-08',
    name: 'Olive Viscose Blend A-Line Kurta',
    color: 'Olive', fabric: 'Viscose blend', tone: 'olive',
    price: 899, mrp: 1399,
    colors: ['Olive'],
    description: 'A graceful A-line silhouette in a muted olive viscose blend that drapes softly and moves beautifully. The gentle flare from the waist makes it universally flattering. A round neckline with minimal detailing keeps the look clean and contemporary. Works equally well for casual days and relaxed celebrations.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-09',
    name: 'Dusty Blue Cotton Blend Panelled Kurta',
    color: 'Dusty Blue', fabric: 'Cotton blend', tone: 'blue',
    price: 1149, mrp: 1799,
    colors: ['Dusty Blue'],
    description: 'Vertical panels in a tonal dusty blue cotton blend create a clean, structured silhouette with a subtle design element. The panelling adds definition to the straight cut and gives a modern, architectural quality. Breathable cotton blend fabric makes it appropriate for everyday office and casual wear alike.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-10',
    name: 'Terracotta Viscose Blend Relaxed Kurta',
    color: 'Terracotta', fabric: 'Viscose blend', tone: 'clay',
    price: 825, mrp: 825,
    colors: ['Terracotta', 'Earth Rose', 'Olive'],
    description: 'A relaxed, easy-fit kurta in warm terracotta viscose blend — the kind of piece you reach for on days when you want to look intentional without any effort. Drop shoulders, a round neckline, and a straight hem. Pairs well with white or cream palazzos and block-heeled sandals for an effortless everyday look.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-11',
    name: 'Warm Ivory Cotton Blend Embroidered Kurta',
    color: 'Warm Ivory', fabric: 'Cotton blend', tone: 'sand',
    price: 1349, mrp: 2099,
    colors: ['Warm Ivory'],
    description: 'Delicate thread embroidery in soft gold and cream tones runs along the round neckline and hemline of this warm ivory cotton blend kurta. The subtle embroidery adds elegance without being ornate. Three-quarter sleeves, side slits, and a straight silhouette. Beautiful for festive occasions, functions, and elevated everyday wear.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-12',
    name: 'Soft Plum Viscose Blend Everyday Kurta',
    color: 'Soft Plum', fabric: 'Viscose blend', tone: 'plum',
    price: 799, mrp: 1249,
    colors: ['Soft Plum', 'Terracotta', 'Dusty Blue'],
    description: 'A reliable everyday straight kurta in a soft, muted plum viscose blend. The colour is rich enough to feel special while remaining versatile enough for daily wear. Relaxed silhouette, round neckline, and three-quarter sleeves. An honest, well-made wardrobe essential that gets better with repeated wear.',
  },

  // ── KURTA SETS (6) ──────────────────────────────────────────────────────────
  {
    category: 'kurta-sets', sku: 'AUR-02-01',
    name: 'Navy Blue Printed Straight Kurta & Palazzo Set',
    color: 'Navy Blue', fabric: 'Rayon', tone: 'blue',
    price: 1499, mrp: 1499,
    colors: ['Navy Blue', 'Burgundy'],
    description: 'An all-over conversational print in white runs across the kurta and matching palazzo, tying the set together effortlessly. The rayon fabric drapes beautifully and stays wrinkle-resistant through long days. A versatile two-piece that is as comfortable at office parties as it is on festive evenings.',
  },
  {
    category: 'kurta-sets', sku: 'AUR-02-02',
    name: 'Old Rose Cotton Straight Suit Set',
    color: 'Old Rose', fabric: 'Pure Cotton', tone: 'rose',
    price: 2499, mrp: 3999,
    colors: ['Old Rose'],
    description: 'The old rose shade of this pure cotton three-piece suit set is that rare, timeless pink that suits every skin tone. The kurta has a subtle pintuck detailing at the yoke, paired with straight pants and a coordinating dupatta with a woven border. Pure cotton makes it breathable enough for day-long wear.',
  },
  {
    category: 'kurta-sets', sku: 'AUR-02-03',
    name: 'Mustard Floral Anarkali Kurta & Churidar Set',
    color: 'Mustard', fabric: 'Cotton blend', tone: 'sand',
    price: 2799, mrp: 4499,
    colors: ['Mustard'],
    description: 'A dense floral print in earthy reds and greens covers this mustard Anarkali kurta, paired with a fitted churidar that emphasises the flare. The flared Anarkali silhouette is eternally elegant. Cotton blend keeps it light and easy to move in. A natural choice for festive gatherings and Diwali celebrations.',
  },
  {
    category: 'kurta-sets', sku: 'AUR-02-04',
    name: 'Turquoise Viscose Rayon Embroidered Kurta Set',
    color: 'Turquoise', fabric: 'Viscose Rayon', tone: 'blue',
    price: 1899, mrp: 1899,
    colors: ['Turquoise', 'Coral'],
    description: 'Machine embroidery in geometric patterns covers the neckline and hemline of this turquoise viscose rayon kurta set. Comes with matching straight pants and a dupatta in a complementary shade. The viscose rayon drapes well and has a beautiful subtle sheen. Ready to wear out of the box.',
  },
  {
    category: 'kurta-sets', sku: 'AUR-02-05',
    name: 'Indigo Cotton Hand-Embroidered Straight Suit Set',
    color: 'Indigo', fabric: 'Pure Cotton', tone: 'blue',
    price: 2999, mrp: 4799,
    colors: ['Indigo'],
    description: 'Hand-embroidered with white thread work along the neckline and hemline of this classic indigo pure cotton straight suit set. Comes with straight pants and a coordinating dupatta with an embroidered border. The deep indigo against white embroidery is a combination that never goes out of style. Ethically made.',
  },
  {
    category: 'kurta-sets', sku: 'AUR-02-06',
    name: 'Rust Angrakha Festive Anarkali Suit Set',
    color: 'Rust', fabric: 'Cotton blend', tone: 'clay',
    price: 2599, mrp: 4199,
    colors: ['Rust'],
    description: 'An angrakha-style crossover neckline adds a heritage element to this rust cotton blend Anarkali suit set. The flared skirt portion has intricate threadwork at the hem. Paired with fitted churidar and a sheer embroidered dupatta. A show-stopper for weddings and formal festive events.',
  },

  // ── SUITS (6) ────────────────────────────────────────────────────────────────
  {
    category: 'suits', sku: 'AUR-03-01',
    name: 'Sage Chanderi Silk Suit Set',
    color: 'Sage', fabric: 'Chanderi Silk', tone: 'olive',
    price: 3999, mrp: 6499,
    colors: ['Sage'],
    description: 'Chanderi silk is known for its characteristic sheer texture, lightweight body, and natural sheen — this sage-toned suit set captures all three. The kurta has a subtle woven motif border, paired with matching straight pants and a chanderi dupatta. An effortlessly elegant choice for formal occasions and weddings.',
  },
  {
    category: 'suits', sku: 'AUR-03-02',
    name: 'Ivory Zardozi Embroidered Suit Set',
    color: 'Ivory', fabric: 'Georgette', tone: 'sand',
    price: 4999, mrp: 7999,
    colors: ['Ivory'],
    description: 'Zardozi — the ancient craft of metal thread embroidery — adorns the neckline, yoke, and sleeve cuffs of this ivory georgette suit set. Gold metallic threads create floral and arabesque patterns that catch the light brilliantly. Comes with straight pants and a zardozi-embroidered dupatta. For celebrations worth dressing up for.',
  },
  {
    category: 'suits', sku: 'AUR-03-03',
    name: 'Lavender Cotton Lucknowi Suit Set',
    color: 'Lavender', fabric: 'Cotton', tone: 'plum',
    price: 2499, mrp: 2499,
    colors: ['Lavender', 'Mint'],
    description: 'Chikankari embroidery in white shadow work and mul stitches covers the yoke of this lavender pure cotton suit set. The clean cut and breathable cotton make this appropriate for summer weddings, Eid, and office celebrations. Comes with cotton palazzo and a self-coloured dupatta with border.',
  },
  {
    category: 'suits', sku: 'AUR-03-04',
    name: 'Wine Banaras Brocade Suit Set',
    color: 'Wine', fabric: 'Brocade', tone: 'plum',
    price: 4799, mrp: 7499,
    colors: ['Wine'],
    description: 'A rich wine-coloured Banarasi brocade fabric woven in Varanasi with gold zari patterns forms this stunning suit set. The kurta has a boat neckline with zari piping, paired with a flared palazzo and sheer net dupatta with brocade border. Wear this to weddings, receptions, or any event where you want to be remembered.',
  },
  {
    category: 'suits', sku: 'AUR-03-05',
    name: 'Seafoam Cambric Printed Suit Set',
    color: 'Seafoam', fabric: 'Cambric Cotton', tone: 'blue',
    price: 1799, mrp: 1799,
    colors: ['Seafoam', 'Peach'],
    description: 'A fresh block-print floral pattern in earthy tones runs across this seafoam cambric cotton suit set. Cambric cotton is tightly woven and ultra-smooth to the touch, making it perfect for all-day comfort. Paired with matching straight pants and a contrasting dupatta. A sensible everyday ethnic option.',
  },
  {
    category: 'suits', sku: 'AUR-03-06',
    name: 'Peach Organza Embroidered Suit Set',
    color: 'Peach', fabric: 'Organza', tone: 'rose',
    price: 4499, mrp: 7199,
    colors: ['Peach'],
    description: 'Delicate floral embroidery in silk threads covers the sheer organza kurta of this peach suit set. The layered organza over an inner slip gives depth and movement. Paired with straight satin pants and an organza dupatta with a scalloped embroidered edge. Beautiful for sangeet ceremonies, mehendi, and cocktail events.',
  },

  // ── DRESSES (6 original + 6 modern/funky) ───────────────────────────────────
  {
    category: 'dresses', sku: 'AUR-04-01',
    name: 'Indigo Cotton Floral Tiered Dress',
    color: 'Indigo', fabric: 'Pure Cotton', tone: 'blue',
    price: 2499, mrp: 3999,
    colors: ['Indigo'],
    description: 'Three tiers of indigo cotton cascade to mid-calf, each tier carrying a white floral block print. The smocked bodice adjusts to fit and the cotton fabric stays cool through warm days. Wear it with kolhapuris for an effortless ethnic-western fusion. Machine washable and looks better with every wash.',
  },
  {
    category: 'dresses', sku: 'AUR-04-02',
    name: 'Rust Cotton Midi Shirt Dress',
    color: 'Rust', fabric: 'Pure Cotton', tone: 'clay',
    price: 2199, mrp: 2199,
    colors: ['Rust', 'Olive', 'Slate Blue'],
    description: 'A button-down shirt dress cut in breathable pure cotton in a warm rust tone. The relaxed midi length falls to the knee, with a side slit for ease. Roll up the cuffs and leave the collar open for a casual look, or belt it at the waist to define your silhouette. Transitions from work to weekend seamlessly.',
  },
  {
    category: 'dresses', sku: 'AUR-04-03',
    name: 'Magenta Rayon Wrap Dress',
    color: 'Magenta', fabric: 'Rayon', tone: 'plum',
    price: 2699, mrp: 4299,
    colors: ['Magenta'],
    description: 'A flattering wrap silhouette in fluid rayon creates a look that suits every body type. The magenta is rich and vibrant — pair it with tan block heels and jhumkas for an evening look, or wear it with sandals for day. The wrap ties securely and the length is a confident midi.',
  },
  {
    category: 'dresses', sku: 'AUR-04-04',
    name: 'Olive Viscose Printed Pleated Midi',
    color: 'Olive', fabric: 'Viscose', tone: 'olive',
    price: 2299, mrp: 2299,
    colors: ['Olive'],
    description: 'Box pleats from waist to hem give this olive viscose midi dress beautiful volume and movement. An earthy leaf print runs across the fabric. The square neckline and puff sleeves make it feel fashion-forward without being fussy. Fits as well for a day in the city as it does for a relaxed festive gathering.',
  },
  {
    category: 'dresses', sku: 'AUR-04-05',
    name: 'Dusty Pink Chanderi Maxi Dress',
    color: 'Dusty Pink', fabric: 'Chanderi', tone: 'rose',
    price: 3999, mrp: 6499,
    colors: ['Dusty Pink'],
    description: 'A floor-length Chanderi maxi with a scooped neckline, subtle gold woven border, and flared skirt section. The natural sheen of chanderi gives this dress a quietly glamorous quality. It is relaxed enough for an afternoon occasion but striking enough for an evening event. Wear with gold juttis and minimal jewellery.',
  },
  {
    category: 'dresses', sku: 'AUR-04-06',
    name: 'White Cotton Embroidered Midi Dress',
    color: 'White', fabric: 'Pure Cotton', tone: 'sand',
    price: 2999, mrp: 4799,
    colors: ['White'],
    description: 'White mirror-work embroidery and schiffli lace inserts adorn the bodice and hemline of this pure cotton midi dress. The white-on-white textures create a sophisticated, bridal-adjacent look that works across celebrations. Fitted at the bust with a gently flared skirt. Beautiful worn at a daytime wedding or mehendi.',
  },
  // ── Modern & Funky additions ─────────────────────────────────────────────────
  {
    category: 'dresses', sku: 'AUR-04-07',
    name: 'Cobalt Blue Smocked Boho Midi Dress',
    color: 'Cobalt Blue', fabric: 'Rayon', tone: 'blue',
    price: 2399, mrp: 3799,
    colors: ['Cobalt Blue', 'Burnt Orange', 'Sage Green'],
    description: 'A smocked bodice, bishop sleeves, and a flowy tiered skirt make this cobalt blue rayon midi dress the ultimate boho-chic pick. The elasticated smocking means it fits perfectly without trying. Wear barefoot at a beach wedding or with chunky silver jewellery for a rooftop party. Effortlessly cool, instantly noticed.',
  },
  {
    category: 'dresses', sku: 'AUR-04-08',
    name: 'Neon Yellow Abstract Printed Mini Dress',
    color: 'Neon Yellow', fabric: 'Crepe', tone: 'sand',
    price: 2099, mrp: 2099,
    colors: ['Neon Yellow', 'Hot Pink'],
    description: 'Bold, graphic, unapologetically loud — this neon yellow crepe mini dress with an abstract brushstroke print is for the woman who likes to walk into a room and own it. A structured off-shoulder neckline and fitted bodice with a short flared skirt. Pair with clear heels, minimal makeup, and maximum confidence.',
  },
  {
    category: 'dresses', sku: 'AUR-04-09',
    name: 'Black Cutout Detail Bodycon Midi Dress',
    color: 'Black', fabric: 'Lycra blend', tone: 'plum',
    price: 2799, mrp: 4499,
    colors: ['Black', 'Cobalt Blue'],
    description: 'Strategic waist cutouts and a figure-hugging midi silhouette make this black lycra blend dress a statement for nights out. The fabric has a comfortable stretch and holds its shape all evening. Elegant enough for a cocktail party, edgy enough for a concert. Style with heeled boots and silver hoops.',
  },
  {
    category: 'dresses', sku: 'AUR-04-10',
    name: 'Mustard & Black Colour-Block Shift Dress',
    color: 'Mustard', fabric: 'Scuba Crepe', tone: 'sand',
    price: 2599, mrp: 4199,
    colors: ['Mustard'],
    description: 'Bold colour-blocking in mustard and black scuba crepe creates a graphic, modern shift dress that stands out without any accessories. A sleeveless silhouette with a subtle A-line drape — comfortable at the waist and flattering at the hem. Wear to an art gallery opening, a brunch, or a creative office. Modern, confident, fun.',
  },
  {
    category: 'dresses', sku: 'AUR-04-11',
    name: 'Hot Pink Ruffle Wrap Dress',
    color: 'Hot Pink', fabric: 'Georgette', tone: 'rose',
    price: 3199, mrp: 5199,
    colors: ['Hot Pink', 'Cobalt Blue', 'Orange'],
    description: 'Cascading ruffles on the wrap skirt and a deep V-neckline give this hot pink georgette dress maximum drama and femininity. The georgette floats as you move, making every step a moment. Ideal for birthday parties, cocktail evenings, and any occasion that deserves a pink moment. Totally and unapologetically fun.',
  },
  {
    category: 'dresses', sku: 'AUR-04-12',
    name: 'Sage Green Linen Balloon-Sleeve Midi Dress',
    color: 'Sage Green', fabric: 'Linen blend', tone: 'olive',
    price: 2899, mrp: 2899,
    colors: ['Sage Green', 'Terracotta', 'Dusty Lavender'],
    description: 'Voluminous balloon sleeves, a cinched waist with a self-tie belt, and a midi length — this sage green linen blend dress is the chicest thing you can wear with no effort at all. The relaxed linen blend keeps it breathable for long summer days. A contemporary silhouette that bridges casual and dressed-up effortlessly.',
  },

  // ── SAREES (6) ───────────────────────────────────────────────────────────────
  {
    category: 'sarees', sku: 'AUR-05-01',
    name: 'Teal Banarasi Silk Saree',
    color: 'Teal', fabric: 'Banarasi Silk', tone: 'blue',
    price: 8999, mrp: 14999,
    colors: ['Teal'],
    description: 'Woven in Varanasi with gold zari motifs of paisleys and florals, this teal Banarasi silk saree carries centuries of craft in every thread. The rich silk has a natural lustre that photographs beautifully. A broad zari border and embellished pallu make it ideal for weddings, receptions, and significant celebrations.',
  },
  {
    category: 'sarees', sku: 'AUR-05-02',
    name: 'Coral Linen Handloom Saree',
    color: 'Coral', fabric: 'Handloom Linen', tone: 'clay',
    price: 5499, mrp: 5499,
    colors: ['Coral'],
    description: 'Handwoven on traditional looms, this coral linen saree has a beautiful natural texture and a cool, matte finish. A white woven stripe border runs along the length. Linen drapes with a relaxed elegance and is light enough for summer office wear. Easy to drape and maintain. A thoughtful everyday saree.',
  },
  {
    category: 'sarees', sku: 'AUR-05-03',
    name: 'Navy Blue Georgette Printed Saree',
    color: 'Navy Blue', fabric: 'Georgette', tone: 'blue',
    price: 6499, mrp: 10999,
    colors: ['Navy Blue'],
    description: 'A delicate abstract floral print in white and gold runs across this navy blue georgette saree. Georgette drapes beautifully and the flowing fabric creates an elegant silhouette. A contrast border in gold adds definition. A versatile saree that works from formal office events to evening weddings.',
  },
  {
    category: 'sarees', sku: 'AUR-05-04',
    name: 'Mustard Tussar Silk Saree',
    color: 'Mustard', fabric: 'Tussar Silk', tone: 'sand',
    price: 7999, mrp: 12999,
    colors: ['Mustard'],
    description: 'Tussar silk is prized for its rich texture and natural gold sheen — this mustard piece is a fine example. Tribal-inspired kantha embroidery in red and green runs across the pallu. A broad border with mirror work adds festive sparkle. This saree pairs with contrast blouses and minimal jewellery.',
  },
  {
    category: 'sarees', sku: 'AUR-05-05',
    name: 'Ivory Cotton Tant Saree',
    color: 'Ivory', fabric: 'Cotton Tant', tone: 'sand',
    price: 5199, mrp: 5199,
    colors: ['Ivory'],
    description: 'Bengal\'s iconic tant weave creates a light, airy cotton saree in ivory with a red woven border. Tant sarees are known for their softness, breathability, and effortless drape — the daily choice of generations of women. Casual enough for morning wear, but with the right blouse, equally beautiful for a low-key celebration.',
  },
  {
    category: 'sarees', sku: 'AUR-05-06',
    name: 'Burgundy Velvet Embroidered Saree',
    color: 'Burgundy', fabric: 'Velvet', tone: 'plum',
    price: 11999, mrp: 19999,
    colors: ['Burgundy'],
    description: 'Rich burgundy velvet with gold sequin and resham embroidery across the border and pallu. Velvet sarees are the quintessential winter celebration drape — warm, luxurious, and deeply flattering. The gold embroidery against burgundy velvet creates a regal effect ideal for evening weddings and grand celebrations.',
  },

  // ── LEHENGAS (6) ─────────────────────────────────────────────────────────────
  {
    category: 'lehengas', sku: 'AUR-06-01',
    name: 'Blush Pink Mirror Work Lehenga Set',
    color: 'Blush Pink', fabric: 'Net over silk', tone: 'rose',
    price: 11999, mrp: 19999,
    colors: ['Blush Pink'],
    description: 'All-over mirror work and sequin embroidery on a blush pink net-over-silk lehenga skirt. The flared skirt fans beautifully with every movement. Comes with a matching heavily embroidered blouse and a sheer dupatta with mirror-work border. Created for sangeet nights, mehendia functions, and wedding receptions.',
  },
  {
    category: 'lehengas', sku: 'AUR-06-02',
    name: 'Emerald Zardozi Bridal Lehenga',
    color: 'Emerald', fabric: 'Raw Silk', tone: 'olive',
    price: 14999, mrp: 24999,
    colors: ['Emerald'],
    description: 'Heavy zardozi embroidery in gold and silver metallic threads covers the entirety of this emerald raw silk bridal lehenga. The broad hem border has floral zardozi motifs. Comes with a richly embroidered blouse and a katan silk dupatta with a zardozi pallu. For brides who want to stand out beautifully.',
  },
  {
    category: 'lehengas', sku: 'AUR-06-03',
    name: 'Coral Floral Embroidered Lehenga Set',
    color: 'Coral', fabric: 'Cotton Silk', tone: 'clay',
    price: 8999, mrp: 8999,
    colors: ['Coral'],
    description: 'Multi-coloured thread embroidery creates a garden of flowers across the coral cotton silk lehenga skirt. A lighter choice than silk, cotton silk is comfortable to wear for longer occasions. Comes with a crop top blouse with back tie and a sheer dupatta. Beautiful for mehendi, day weddings, and birthday celebrations.',
  },
  {
    category: 'lehengas', sku: 'AUR-06-04',
    name: 'Wine Velvet Lehenga Set',
    color: 'Wine', fabric: 'Velvet', tone: 'plum',
    price: 9999, mrp: 16999,
    colors: ['Wine'],
    description: 'Deep wine velvet with all-over gold foil print and sequin embroidery. The lehenga skirt has a heavy flare that photographs magnificently. Comes with a matching velvet blouse with gold border detailing and a net dupatta with gold sequin border. Perfect for cocktail evenings, receptions, and winter weddings.',
  },
  {
    category: 'lehengas', sku: 'AUR-06-05',
    name: 'Lemon Yellow Thread Work Lehenga Set',
    color: 'Lemon Yellow', fabric: 'Georgette', tone: 'sand',
    price: 8499, mrp: 8499,
    colors: ['Lemon Yellow'],
    description: 'Dense multicolour thread embroidery in geometric and floral patterns covers the lemon yellow georgette lehenga skirt. The bright yellow is ideal for haldi and mehendi functions. Comes with a matching embroidered blouse and contrasting dupatta with a thread-work border. Spread joy in every step you take.',
  },
  {
    category: 'lehengas', sku: 'AUR-06-06',
    name: 'Powder Blue Organza Lehenga Set',
    color: 'Powder Blue', fabric: 'Organza', tone: 'blue',
    price: 10999, mrp: 17999,
    colors: ['Powder Blue'],
    description: 'Multiple layers of powder blue organza create a dreamy, voluminous lehenga skirt with a silver sequin border. The sheer quality of organza gives the skirt a feather-light feel despite its fullness. Comes with an embellished blouse and an organza dupatta with scalloped sequin edges. For those who want to feel like they are floating.',
  },

  // ── BOTTOM WEAR (6) ──────────────────────────────────────────────────────────
  {
    category: 'bottom-wear', sku: 'AUR-07-01',
    name: 'Indigo Cotton Straight Pants',
    color: 'Indigo', fabric: 'Pure Cotton', tone: 'blue',
    price: 899, mrp: 899,
    colors: ['Indigo', 'White', 'Black'],
    description: 'Straight-cut pants in pure cotton that hold their shape without feeling stiff. The deep indigo is a versatile everyday neutral for ethnic and Western tops alike. An elastic waistband ensures all-day comfort without compromising on the clean, tailored look. Pairs with virtually everything in your wardrobe.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-02',
    name: 'Rust Wide-Leg Palazzos',
    color: 'Rust', fabric: 'Viscose', tone: 'clay',
    price: 1099, mrp: 1699,
    colors: ['Rust', 'Teal', 'Olive'],
    description: 'A relaxed, wide-leg palazzo in flowing viscose that drapes beautifully with every step. The warm rust tone works especially well with cream, gold, and green kurtas. Side pockets and an elasticated waistband make them as practical as they are stylish. The go-to bottom for kurta sets and standalone pairing.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-03',
    name: 'White Cotton Sharara Pants',
    color: 'White', fabric: 'Pure Cotton', tone: 'sand',
    price: 1199, mrp: 1899,
    colors: ['White'],
    description: 'Traditional sharara pants with a wide flare from the knee down, cut in pure white cotton. Subtle schiffli embroidery at the hem adds a delicate finishing touch. The sharara silhouette has been a classic of South Asian festive fashion for centuries. Wear with a short embroidered kurta or a crop top blouse.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-04',
    name: 'Black Rayon Dhoti Pants',
    color: 'Black', fabric: 'Rayon', tone: 'plum',
    price: 999, mrp: 999,
    colors: ['Black', 'Navy Blue', 'Maroon'],
    description: 'Draped at the front in the style of a dhoti but cut for modern ease, these black rayon pants hit the sweet spot between ethnic and contemporary. The fluid rayon moves well, making them comfortable for long events. Great with fitted kurtas, structured tops, and formal blouses. A versatile ethnic bottom.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-05',
    name: 'Mustard Silk Blend Cigarette Pants',
    color: 'Mustard', fabric: 'Silk blend', tone: 'sand',
    price: 1149, mrp: 1849,
    colors: ['Mustard', 'Wine', 'Forest Green'],
    description: 'Slim, well-fitted cigarette pants in a silk blend with a subtle sheen. The mustard is one of those tones that immediately elevates any outfit — pair with a white chikankari kurta for an effortless, put-together look. Side zip, flat front, and ankle length. Suitable for office celebrations and semi-formal occasions.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-06',
    name: 'Lavender Cotton Flared Skirt',
    color: 'Lavender', fabric: 'Cotton', tone: 'plum',
    price: 849, mrp: 849,
    colors: ['Lavender'],
    description: 'A gently flared cotton skirt in soft lavender with a subtle broderie anglaise hem border. Elastic waistband and a fluid drape make it easy to wear all day. Pairs beautifully with fitted embroidered tops, crop blouses, and simple short kurtas. A fresh, feminine piece that works across multiple styling options.',
  },

  // ── CO-ORD SETS (6) ──────────────────────────────────────────────────────────
  {
    category: 'co-ord-sets', sku: 'AUR-08-01',
    name: 'Sage Linen Shirt & Wide-Leg Set',
    color: 'Sage', fabric: 'Linen', tone: 'olive',
    price: 2499, mrp: 3999,
    colors: ['Sage', 'White', 'Caramel'],
    description: 'A relaxed linen shirt with a mandarin collar and front tuck paired with wide-leg linen trousers. The sage green is muted and easy — works as a set or split between different outfits. Linen\'s natural texture and breathability make this the ideal summer or resort option. Minimalist and intentional.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-02',
    name: 'Coral Cotton Block-Print Co-ord Set',
    color: 'Coral', fabric: 'Pure Cotton', tone: 'clay',
    price: 1999, mrp: 1999,
    colors: ['Coral'],
    description: 'A matching block-print set — fitted top and wide palazzo pants — in a warm coral pure cotton. The print is a traditional Rajasthani sanganeri pattern in ivory and gold. Wear as a set for festive occasions or pair the top with plain trousers and the palazzo with a solid kurta. A versatile investment.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-03',
    name: 'Ivory Schiffli Co-ord Set',
    color: 'Ivory', fabric: 'Cotton', tone: 'sand',
    price: 2799, mrp: 4499,
    colors: ['Ivory'],
    description: 'A delicate schiffli lace-embroidered cotton co-ord — a relaxed top with floral cut-outs paired with wide straight trousers. The all-ivory look is clean, bridal-adjacent, and works for engagement functions, mehendia, and day parties. The embroidery catches light beautifully. Easy to dress up or down.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-04',
    name: 'Navy Striped Rayon Tunic & Palazzo Set',
    color: 'Navy', fabric: 'Rayon', tone: 'blue',
    price: 1649, mrp: 1649,
    colors: ['Navy', 'Maroon'],
    description: 'Fine vertical stripes in white on a navy rayon tunic with a V-neckline, paired with matching flared palazzo pants. The classic stripe combination makes this effortlessly smart for everyday office wear. Rayon\'s natural drape keeps it from looking stiff. A co-ord set that doesn\'t look like one.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-05',
    name: 'Teal Silk Blend Crop Top & Flared Skirt Set',
    color: 'Teal', fabric: 'Silk blend', tone: 'blue',
    price: 2999, mrp: 4799,
    colors: ['Teal'],
    description: 'A structured silk blend crop top with a round neckline and flared skirt in matching teal. The A-line flare of the skirt adds volume and movement. Wear as a set for evenings or style the top with cigarette pants and the skirt with a fitted blouse. The silk blend gives a subtle shine ideal for evening occasions.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-06',
    name: 'Rust Embroidered Angrakha Top & Pant Set',
    color: 'Rust', fabric: 'Cotton blend', tone: 'clay',
    price: 2599, mrp: 4199,
    colors: ['Rust'],
    description: 'A contemporary angrakha-style top with a crossover neckline and thread embroidery on the yoke, paired with matching straight pants in rust cotton blend. The angrakha neckline is a traditional element that feels modern here. A thoughtful set for office celebrations, festivities, and occasions where you want to stand out.',
  },

  // ── DUPATTAS (6) — names match public/products/dupattas/ image files ──────────
  {
    category: 'dupattas', sku: 'AUR-09-01',
    name: 'Dusty Blue Cotton Textured Dupatta',
    color: 'Dusty Blue', fabric: 'Cotton', tone: 'blue',
    price: 649, mrp: 649,
    colors: ['Dusty Blue', 'Soft Plum', 'Earth Rose'],
    description: 'A soft cotton dupatta in a calming dusty blue with a subtle woven texture running across its length. Four-sided tassel fringe gives it a relaxed finish. Lightweight enough to drape as a stole, substantial enough to complete an ethnic look. Machine washable and easy to care for — a reliable everyday dupatta.',
  },
  {
    category: 'dupattas', sku: 'AUR-09-02',
    name: 'Earth Rose Cotton Lightweight Dupatta',
    color: 'Earth Rose', fabric: 'Cotton', tone: 'rose',
    price: 749, mrp: 1199,
    colors: ['Earth Rose'],
    description: 'A breezy, ultra-lightweight cotton dupatta in a warm earth rose tone. The airy weave keeps it cool in summer while the tasselled edges add a considered finishing touch. Drapes beautifully over plain kurtas and suits. An understated, versatile wardrobe staple.',
  },
  {
    category: 'dupattas', sku: 'AUR-09-03',
    name: 'Olive Viscose Bordered Dupatta',
    color: 'Olive', fabric: 'Viscose', tone: 'olive',
    price: 599, mrp: 599,
    colors: ['Olive', 'Terracotta', 'Warm Ivory'],
    description: 'A flowing viscose dupatta in muted olive with a contrast embroidered border in ivory. The viscose fabric drapes with a natural softness and subtle sheen. The bordered edge adds visual definition without competing with your outfit. An earthy, refined addition to both plain and printed suits.',
  },
  {
    category: 'dupattas', sku: 'AUR-09-04',
    name: 'Soft Plum Viscose Occasion Dupatta',
    color: 'Soft Plum', fabric: 'Viscose', tone: 'plum',
    price: 799, mrp: 1299,
    colors: ['Soft Plum'],
    description: 'A rich soft plum viscose dupatta with delicate foil-print accents along the border — enough shimmer to feel festive without being over the top. The flowing viscose drapes effortlessly and photographs beautifully. Elevates a plain churidar set for weddings and formal gatherings.',
  },
  {
    category: 'dupattas', sku: 'AUR-09-05',
    name: 'Terracotta Viscose Printed Dupatta',
    color: 'Terracotta', fabric: 'Viscose', tone: 'clay',
    price: 529, mrp: 529,
    colors: ['Terracotta', 'Olive', 'Dusty Blue'],
    description: 'A warm terracotta viscose dupatta with an all-over sanganeri block-print in ivory and rust. The earthy print has a handcrafted quality that feels authentic. Lightweight and easy to drape — a cheerful everyday dupatta.',
  },
  {
    category: 'dupattas', sku: 'AUR-09-06',
    name: 'Warm Ivory Soft Cotton Dupatta',
    color: 'Warm Ivory', fabric: 'Cotton', tone: 'sand',
    price: 699, mrp: 1099,
    colors: ['Warm Ivory', 'Dusty Blue', 'Soft Plum'],
    description: 'A classic warm ivory cotton dupatta with a fine chikankari-inspired woven border on all four sides. The soft cotton weave is breathable and non-scratchy. A versatile neutral that pairs with virtually any coloured kurta or suit set.',
  },

  // ── BLACK PRODUCTS (across categories) ──────────────────────────────────────
  {
    category: 'kurtas', sku: 'AUR-01-13',
    name: 'Black Schiffli Embroidered Straight Kurta',
    color: 'Black', fabric: 'Rayon', tone: 'plum',
    price: 1199, mrp: 1849,
    colors: ['Black', 'White', 'Wine'],
    description: 'Delicate schiffli embroidery in white thread covers the neckline, yoke, and cuffs of this sleek black rayon straight kurta. The contrast of white embroidery on black fabric creates a graphic, sophisticated effect. A modern go-to for office wear, festive evenings, and anywhere you want to look effortlessly sharp.',
  },
  {
    category: 'kurtas', sku: 'AUR-01-14',
    name: 'Black Geometric Ikat A-Line Kurta',
    color: 'Black', fabric: 'Viscose', tone: 'plum',
    price: 999, mrp: 999,
    colors: ['Black'],
    description: 'A bold geometric ikat print in white and gold runs across this black viscose A-line kurta. The contrast of the bright ikat pattern against a deep black ground makes it instantly eye-catching. The A-line flare is universally flattering. Pair with white cigarette pants for maximum impact.',
  },
  {
    category: 'dresses', sku: 'AUR-04-13',
    name: 'Black Rayon Smocked Tiered Midi Dress',
    color: 'Black', fabric: 'Rayon', tone: 'plum',
    price: 2199, mrp: 3499,
    colors: ['Black', 'Emerald Green', 'Deep Wine'],
    description: 'A smocked bodice with three tiered panels cascading in black rayon — effortlessly chic for evenings and events. The elasticated smocking fits comfortably without adjustment. Each tier adds movement as you walk. Dressed up with strappy heels and gold jewellery or down with white sneakers, this dress always works.',
  },
  {
    category: 'dresses', sku: 'AUR-04-14',
    name: 'Black Crepe Midi Shirt Dress',
    color: 'Black', fabric: 'Crepe', tone: 'plum',
    price: 2899, mrp: 4599,
    colors: ['Black'],
    description: 'A refined black crepe shirt dress with a belted waist, shirt collar, and button-front placket. The midi length hits just below the knee — professional enough for a client meeting, stylish enough for dinner after. The crepe fabric has a beautiful matte finish that stays wrinkle-free through long days.',
  },
  {
    category: 'suits', sku: 'AUR-03-07',
    name: 'Black Georgette Embroidered Suit Set',
    color: 'Black', fabric: 'Georgette', tone: 'plum',
    price: 3799, mrp: 6199,
    colors: ['Black'],
    description: 'Gold resham and sequin embroidery adorns the neckline, cuffs, and hemline of this elegant black georgette suit set. Black and gold is a combination that never fails to impress. Comes with matching straight pants and a sheer black dupatta with gold border. A statement choice for receptions, cocktail evenings, and formal events.',
  },
  {
    category: 'suits', sku: 'AUR-03-08',
    name: 'Black Velvet Cold-Shoulder Suit Set',
    color: 'Black', fabric: 'Velvet', tone: 'plum',
    price: 4699, mrp: 4699,
    colors: ['Black'],
    description: 'A luxurious black velvet suit set with a cold-shoulder cutout kurta, paired with straight pants and a sheer net dupatta with velvet border. The cold-shoulder detail adds a contemporary edge to the timeless black velvet. Rich, dramatic, and deeply flattering. Perfect for winter weddings and formal celebrations.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-07',
    name: 'Black Linen Co-ord Set',
    color: 'Black', fabric: 'Linen', tone: 'plum',
    price: 1899, mrp: 1899,
    colors: ['Black', 'Cream', 'Charcoal'],
    description: 'A clean, minimal black linen co-ord — an oversized shirt-style top with a mandarin collar and matching wide-leg trousers. Black linen is the ultimate smart-casual uniform: cool, sophisticated, and endlessly wearable. Wear as a set for a polished look or split the pieces across different outfits in your rotation.',
  },
  {
    category: 'co-ord-sets', sku: 'AUR-08-08',
    name: 'Black Embroidered Crop Top & Palazzo Set',
    color: 'Black', fabric: 'Cotton blend', tone: 'plum',
    price: 2799, mrp: 4499,
    colors: ['Black'],
    description: 'Gold thread embroidery on the yoke of a fitted crop top, paired with flowy wide-leg palazzo pants in the same black cotton blend. A modern festive co-ord that bridges traditional embroidery with a contemporary silhouette. Wear together for a striking ethnic-fusion look or pair the top with a lehenga skirt.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-07',
    name: 'Black Straight-Cut Palazzos',
    color: 'Black', fabric: 'Viscose', tone: 'plum',
    price: 949, mrp: 1499,
    colors: ['Black', 'Navy Blue', 'Charcoal'],
    description: 'A straight wide-leg palazzo in fluid black viscose — the most versatile bottom in any wardrobe. Pairs with everything from embroidered kurtas and crop tops to simple T-shirts. Side pockets, elasticated waistband, and a clean hem. Machine washable and holds its shape wash after wash.',
  },
  {
    category: 'bottom-wear', sku: 'AUR-07-08',
    name: 'Black Silk Blend Flared Skirt',
    color: 'Black', fabric: 'Silk blend', tone: 'plum',
    price: 1099, mrp: 1749,
    colors: ['Black'],
    description: 'A knee-length flared skirt in black silk blend with a subtle shimmer. The flare is wide enough to be dramatic but the length keeps it versatile. An elasticated waistband makes it effortlessly comfortable. Pair with a fitted embroidered blouse for a fusion evening look or a simple white shirt for office.',
  },

  // ── WHITE LEHENGA ─────────────────────────────────────────────────────────
  {
    category: 'lehengas', sku: 'AUR-06-07',
    name: 'White Pearl Bridal Lehenga Set',
    color: 'White', fabric: 'Georgette over Satin', tone: 'sand',
    price: 14999, mrp: 24999,
    colors: ['White'],
    description: 'An ethereal bridal lehenga in ivory-white georgette layered over a satin lining. Delicate pearl and crystal bead embroidery covers the skirt in floral motifs that catch the light with every movement. The flared silhouette is supported by a can-can inner for maximum volume. Comes with a pearl-embroidered choli blouse and a sheer georgette dupatta with a beaded scalloped border. For brides who want to walk down the aisle in quiet luxury.',
  },

  // ── BLACK SAREE ───────────────────────────────────────────────────────────
  {
    category: 'sarees', sku: 'AUR-05-07',
    name: 'Black Kanjivaram Silk Saree',
    color: 'Black', fabric: 'Pure Kanjivaram Silk', tone: 'plum',
    price: 14499, mrp: 23999,
    colors: ['Black'],
    description: 'Woven in the Kanjivaram tradition of Tamil Nadu, this black pure silk saree carries a broad gold zari border in a temple-temple pattern and a richly woven pallu with peacock and floral motifs in gold and crimson. The deep black ground makes the gold zari shimmer intensely. A saree that commands every room it enters — for weddings, receptions, and moments that deserve to be remembered.',
  },

  // ── TOPS & SHIRTS ─────────────────────────────────────────────────────────
  {
    category: 'tops-shirts', sku: 'AUR-10-01',
    name: 'Ivory Schiffli Embroidered Top',
    color: 'Ivory', fabric: 'Cotton', tone: 'sand',
    price: 1299, mrp: 2099,
    colors: ['Ivory', 'Powder Blue', 'Sage Green'],
    description: 'Delicate schiffli machine embroidery in a scattered floral pattern covers this lightweight cotton top. The relaxed fit, round neckline, and short sleeves make it a wardrobe essential that pairs equally well with jeans, palazzos, or skirts. The ivory ground is versatile enough to layer under a jacket or wear alone. Machine washable and easy to maintain.',
  },
  {
    category: 'tops-shirts', sku: 'AUR-10-02',
    name: 'Sage Linen Oversized Shirt',
    color: 'Sage', fabric: 'Linen', tone: 'olive',
    price: 1499, mrp: 2399,
    colors: ['Sage', 'White', 'Dusty Pink'],
    description: 'An oversized linen shirt in a calming sage green — the kind of piece that elevates any outfit with minimal effort. The drop shoulders, curved hem, and chest pocket give it a relaxed, considered silhouette. Wear it open over a crop top with jeans, tucked into wide-leg trousers, or belted at the waist as a dress. Linen breathes beautifully in Indian summers.',
  },
  {
    category: 'tops-shirts', sku: 'AUR-10-03',
    name: 'Black Crop Tie-Front Top',
    color: 'Black', fabric: 'Rayon', tone: 'plum',
    price: 999, mrp: 999,
    colors: ['Black', 'White', 'Rust'],
    description: 'A fitted rayon crop top with a tie-front knot detail at the hem — clean, minimal, and instantly stylish. The short sleeves and round neckline keep it easy while the tie-front adds personality. Wear it with high-waist palazzos, straight pants, or a flared skirt. A go-to piece for casual evenings, office-casual, and weekend outings.',
  },
  {
    category: 'tops-shirts', sku: 'AUR-10-04',
    name: 'Rust Bandhani Peplum Top',
    color: 'Rust', fabric: 'Georgette', tone: 'clay',
    price: 1399, mrp: 2199,
    colors: ['Rust', 'Magenta', 'Teal'],
    description: 'A peplum silhouette in rust georgette with a traditional bandhani (tie-dye) print across the fabric. The fitted bodice and flared peplum hem create a figure-flattering shape, while the georgette drapes softly over the hips. Pair with cigarette pants or a pencil skirt for a festive yet office-appropriate look. The bandhani print celebrates a timeless Indian craft.',
  },
  {
    category: 'tops-shirts', sku: 'AUR-10-05',
    name: 'Powder Blue Cotton Pintuck Shirt',
    color: 'Powder Blue', fabric: 'Pure Cotton', tone: 'blue',
    price: 1149, mrp: 1149,
    colors: ['Powder Blue', 'White', 'Sage'],
    description: 'Vertical pintucks run from the collar to the waist of this structured powder blue cotton shirt, creating a subtle texture that elevates it beyond a basic button-down. The relaxed fit and full sleeves (with buttoned cuffs) give it a polished, office-ready quality. Wear it tucked into high-waist trousers or half-tucked with straight jeans for weekend smart-casual.',
  },
  {
    category: 'tops-shirts', sku: 'AUR-10-06',
    name: 'Mustard Block-Print Kaftan Top',
    color: 'Mustard', fabric: 'Rayon', tone: 'sand',
    price: 1099, mrp: 1749,
    colors: ['Mustard', 'Coral', 'Indigo'],
    description: 'A free-flowing kaftan-style top in fluid rayon with a hand block-print pattern in geometric motifs. The wide silhouette, side slits, and V-neckline make it as comfortable as it is beautiful. Wear it as a top with wide-leg pants or as a beach cover-up. The mustard tone is warm and earthy, pairing well with both gold and silver accessories.',
  },
];

// ── REVIEWERS ─────────────────────────────────────────────────────────────────
const REVIEWERS = [
  'Ananya Iyer', 'Priya Menon', 'Kavya Reddy', 'Sneha Nair', 'Divya Rao',
  'Meera Kulkarni', 'Ritika Sharma', 'Nandini Pillai', 'Aditi Joshi', 'Pooja Verma',
  'Shruti Desai', 'Isha Bhatt', 'Tanvi Shah', 'Lakshmi Krishnan', 'Sana Khan',
  'Neha Gupta', 'Rhea Kapoor', 'Simran Kaur', 'Aishwarya Nag', 'Deepa Balan',
  'Trisha Mehta', 'Vaishnavi Rao', 'Mahika Sinha', 'Anjali Das', 'Radhika Bose',
  'Ira Chatterjee', 'Kritika Jain', 'Bhavya Rao', 'Charvi Naidu', 'Zoya Ansari',
];

const REVIEWS = {
  'kurtas': [
    [5, 'Everyday favourite', 'The fabric is so soft — I have worn this three times already this week. Fits perfectly.'],
    [4, 'Lovely colour, great quality', 'The shade is exactly as shown. Very comfortable for long office days.'],
    [5, 'Beautiful craft', 'The embroidery/print is stunning in person. Worth every rupee. Got so many compliments.'],
    [4, 'Comfortable and versatile', 'Pairs well with both palazzos and jeans. Colour stayed vibrant after washing.'],
    [3, 'Nice but runs slim', 'Pretty kurta but a touch fitted for me. The material and finish are good otherwise.'],
  ],
  'kurta-sets': [
    [5, 'Perfect coordinated set', 'Both pieces match beautifully and the fit is spot on. Got so many compliments.'],
    [5, 'Loved it completely', 'Feels premium and the colour is gorgeous in person. Easy to dress up or down.'],
    [4, 'Good value for the craft', 'Comfortable and well made. Slightly long but easily hemmed.'],
    [4, 'Elegant and effortless', 'Threw it on for a family lunch and felt put together instantly. Will reorder.'],
    [5, 'Excellent quality', 'The fabric quality is outstanding. Truly lived up to the description.'],
  ],
  'suits': [
    [5, 'Beautiful drape', 'The fabric falls so elegantly. Wore it to a wedding and felt lovely all evening.'],
    [4, 'Classy and comfortable', 'Good quality material, true to the pictures. Would have liked a longer dupatta.'],
    [5, 'Festive win', 'Delicate detailing and a flattering cut. Exactly what I hoped for and more.'],
    [4, 'Nice for occasions', 'Comfortable enough to wear for hours. Colour is rich and fabric feels premium.'],
    [5, 'Worth every rupee', 'The embroidery work is stunning. I got endless compliments at the wedding.'],
  ],
  'dresses': [
    [5, 'So flattering', 'The cut is universally flattering and the fabric moves beautifully. Instant favourite.'],
    [4, 'Pretty and easy to wear', 'Great throw-on-and-go dress. A little longer than expected but I love it.'],
    [5, 'Gorgeous in person', 'Feels well made, not see-through, and the colour is stunning in daylight.'],
    [4, 'Lovely but check sizing', 'Lovely dress, just a bit snug at the shoulders. Fabric quality is excellent.'],
    [5, 'My go-to piece', 'I reach for this every time I have an event. Comfortable, stylish and gets compliments.'],
  ],
  'sarees': [
    [5, 'Feather light', 'So easy to drape and carry all day. The texture is beautiful and it did not slip.'],
    [4, 'Elegant everyday saree', 'Lovely for work or small gatherings. Colour is exactly as shown.'],
    [5, 'Beautiful weave and craft', 'The fabric feels wonderful against skin and the fall is perfect.'],
    [4, 'Great value for craft', 'Comes with a good blouse piece and the colour is rich. Very happy.'],
    [5, 'Heirloom quality', 'This is the kind of saree you keep forever. The craftsmanship is outstanding.'],
  ],
  'lehengas': [
    [5, 'Showstopper', 'Wore this to my cousin\'s wedding and felt incredible. The flare is stunning.'],
    [5, 'Worth every rupee', 'The work is intricate and the colour is so rich. Fit was true to the size chart.'],
    [4, 'Beautiful, slightly heavy', 'Gorgeous piece for celebrations. On the heavier side but that is expected.'],
    [4, 'Loved the detailing', 'Elegant and comfortable to move in. Got endless compliments from everyone.'],
    [5, 'A dream lehenga', 'I cried when I received it — it is even more beautiful than the photos. Perfect.'],
  ],
  'bottom-wear': [
    [5, 'Perfect fit', 'Great fit and the fabric is comfortable all day long. Will buy more colours.'],
    [4, 'Versatile basics', 'Goes with everything. Slightly long for me but easy to fix with a hem.'],
    [5, 'Comfortable and well made', 'Holds shape well after washing and the stitching is clean throughout.'],
    [4, 'Good staple piece', 'Simple, well made and true to size. Exactly what I needed for my wardrobe.'],
    [5, 'My new favourite', 'I have worn these almost daily since they arrived. So comfortable and flattering.'],
  ],
  'co-ord-sets': [
    [5, 'Effortless outfit sorted', 'Wear them together or separately — so practical and stylish. Love the fabric.'],
    [4, 'Great for travel', 'Packed it for a trip and wore the pieces multiple ways. Comfortable and cute.'],
    [5, 'Chic and comfortable', 'The set looks expensive and feels soft. Fit is relaxed and flattering.'],
    [4, 'Nice quality set', 'Good quality for the price. The top runs slightly loose which I liked.'],
    [5, 'So many compliments', 'Every time I wear this someone asks where it is from. Love it completely.'],
  ],
  'dupattas': [
    [5, 'Lifts any outfit instantly', 'Beautiful and the perfect finishing touch to a plain kurta.'],
    [4, 'Soft and light', 'Drapes nicely and the colour is true. Edges are neatly finished throughout.'],
    [5, 'Gorgeous craft', 'The embroidery/work is stunning in person. Made my entire suit look complete.'],
    [4, 'Good quality', 'Feels soft, not scratchy at all. Happy with it and will buy in other colours.'],
    [5, 'Statement piece', 'This dupatta is the star of my outfit every time I wear it. Beautiful craft.'],
  ],
  'tops-shirts': [
    [5, 'Perfect everyday top', 'So comfortable and versatile — I wear this at least twice a week.'],
    [4, 'Great quality', 'Fabric feels premium, fits true to size. Really happy with this.'],
    [5, 'Exactly what I needed', 'Pairs with everything in my wardrobe. Will buy in more colours.'],
    [4, 'Stylish and easy', 'Love how effortless this looks. Got so many compliments.'],
    [5, 'Excellent finish', 'The stitching and fabric quality are both outstanding.'],
  ],
};

function seededPick(arr, seed) { return arr[Math.abs(seed) % arr.length]; }

async function seedReviewers() {
  const out = [];
  for (const [i, name] of REVIEWERS.entries()) {
    const email = `reviewer${String(i + 1).padStart(2, '0')}@example.com`;
    const u = await prisma.user.upsert({
      where: { email }, update: {},
      create: { email, name, emailVerified: new Date(), role: 'customer' },
    });
    out.push(u);
  }
  return out;
}

async function main() {
  const reviewers = await seedReviewers();

  // ── Clean up old product data so we start fresh ───────────────────────────
  // This preserves categories and user data (orders, accounts).
  console.log('Clearing old product data…');
  await prisma.review.deleteMany({});
  // Only delete PLACEHOLDER (picsum) images — preserve real uploaded photos.
  await prisma.productImage.deleteMany({ where: { url: { contains: 'picsum.photos' } } });
  await prisma.inventory.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({ where: { orderLines: { none: {} } } });
  console.log('Old products cleared. Seeding new catalogue…');

  // Upsert categories
  const catMap = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug }, update: { name: c.name, description: c.description, sortOrder: c.sort },
      create: { slug: c.slug, name: c.name, description: c.description, sortOrder: c.sort },
    });
    catMap[c.slug] = cat;
  }

  // Upsert products
  for (const [pi, p] of PRODUCTS.entries()) {
    const cat = catMap[p.category];
    const productSlug = slugify(p.name);
    const pricePaise = p.price * 100;
    const mrpPaise   = p.mrp   * 100;

    const product = await prisma.product.upsert({
      where:  { sku: p.sku },
      update: { slug: productSlug, name: p.name, description: p.description, color: p.color, fabric: p.fabric, tone: p.tone, price: pricePaise, mrp: mrpPaise, published: true, categoryId: cat.id },
      create: {
        sku:         p.sku,
        slug:        productSlug,
        name:        p.name,
        description: p.description,
        categoryId:  cat.id,
        color:       p.color,
        fabric:      p.fabric,
        tone:        p.tone,
        price:       pricePaise,
        mrp:         mrpPaise,
        published:   true,
      },
    });

    // Variants: every colour × every size
    const variantRows = [];
    for (const col of p.colors) {
      for (const sz of sizes) {
        variantRows.push({ productId: product.id, size: sz, color: col, sku: `${p.sku}-${colorCode(col)}-${sz}` });
      }
    }
    await prisma.productVariant.createMany({ data: variantRows, skipDuplicates: true });

    // Remove any variants whose colour is no longer in the list (re-seed safety)
    const keepColors = new Set(p.colors);
    await prisma.productVariant.deleteMany({ where: { productId: product.id, color: { notIn: [...keepColors] } } });

    // Inventory: 10 units per variant
    const variants = await prisma.productVariant.findMany({ where: { productId: product.id } });
    for (const v of variants) {
      await prisma.inventory.upsert({
        where:  { variantId: v.id },
        update: {},
        create: { variantId: v.id, quantity: 10 },
      });
    }

    // Placeholder image per colour — only if the product has NO images yet.
    // This preserves real photos wired via the _rewire-images script.
    const existingImageCount = await prisma.productImage.count({ where: { productId: product.id } });
    if (existingImageCount === 0) {
      for (const [ci, col] of p.colors.entries()) {
        const imgUrl = placeholderImage(productSlug, col);
        await prisma.productImage.create({
          data: { productId: product.id, url: imgUrl, type: 'MODEL', altText: `${p.name} — ${col}`, color: col, sortOrder: ci, isPrimary: ci === 0 },
        });
      }
    }

    // Reviews: 2–3 per product
    const bank = REVIEWS[p.category] ?? REVIEWS.kurtas;
    const count = 2 + (pi % 2);
    for (let r = 0; r < count; r++) {
      const [rating, title, body] = bank[(pi + r) % bank.length];
      const reviewer = seededPick(reviewers, pi * 7 + r * 13);
      const exists = await prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId: reviewer.id } } });
      if (!exists) {
        await prisma.review.create({ data: { productId: product.id, userId: reviewer.id, rating, title, body, verified: true, approved: true } });
      }
    }
  }

  console.log(`✔ Seeded ${PRODUCTS.length} real products across ${CATEGORIES.length} categories.`);
  console.log(`  Products range from ₹${Math.min(...PRODUCTS.map(p=>p.price))} to ₹${Math.max(...PRODUCTS.map(p=>p.price))}`);
  console.log(`  Replace placeholder images in Admin → Products before launch.`);
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
