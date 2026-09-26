// Original, non-transactional demo records. Safe to rerun: existing products are not overwritten.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const categories = [
  ['kurtas', 'Kurtas', 'Everyday ease in thoughtful silhouettes.'],
  ['kurta-sets', 'Kurta Sets', 'Considered pairings for every plan.'],
  ['suits', 'Suits', 'Elegant ensembles with modern ease.'],
  ['dresses', 'Dresses', 'One-piece dressing with room to move.'],
  ['sarees', 'Sarees', 'A timeless drape, a fresh perspective.'],
  ['lehengas', 'Lehengas', 'Celebrate in your own way.'],
  ['bottom-wear', 'Bottom Wear', 'The foundations of a versatile wardrobe.'],
  ['co-ord-sets', 'Co-ord Sets', 'Easy pieces made to work together.'],
  ['dupattas', 'Dupattas', 'A finishing touch with personality.'],
];
const styles = {
  kurtas: ['Straight Kurta', 'A-Line Kurta', 'Panelled Kurta', 'Relaxed Kurta', 'Embroidered Kurta', 'Everyday Kurta'],
  'kurta-sets': ['Cotton Kurta Set', 'Printed Kurta Set', 'Three-Piece Set', 'Tonal Kurta Set', 'Festive Kurta Set', 'Linen Blend Set'],
  suits: ['Soft Tailored Suit', 'Chanderi-Inspired Suit', 'Tonal Suit Set', 'Embroidered Suit', 'Classic Suit', 'Evening Suit'],
  dresses: ['Midi Dress', 'Wrap Dress', 'Tiered Dress', 'Shirt Dress', 'Pleated Dress', 'Maxi Dress'],
  sarees: ['Lightweight Saree', 'Textured Saree', 'Printed Saree', 'Evening Saree', 'Everyday Saree', 'Draped Saree'],
  lehengas: ['Festive Lehenga', 'Fluid Lehenga', 'Embroidered Lehenga', 'Tonal Lehenga', 'Celebration Lehenga', 'Classic Lehenga'],
  'bottom-wear': ['Wide-Leg Trousers', 'Straight Pants', 'Relaxed Palazzos', 'Tapered Pants', 'Cotton Trousers', 'Everyday Pants'],
  'co-ord-sets': ['Relaxed Co-ord Set', 'Printed Co-ord Set', 'Summer Co-ord Set', 'Tailored Co-ord Set', 'Weekend Co-ord Set', 'Evening Co-ord Set'],
  dupattas: ['Textured Dupatta', 'Printed Dupatta', 'Soft Cotton Dupatta', 'Occasion Dupatta', 'Lightweight Dupatta', 'Bordered Dupatta'],
};
const palettes = [
  ['Earth Rose', 'rose'], ['Olive', 'olive'], ['Dusty Blue', 'blue'],
  ['Terracotta', 'clay'], ['Warm Ivory', 'sand'], ['Soft Plum', 'plum'],
];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

async function main() {
  for (const [group, [slug, name, description]] of categories.entries()) {
    const category = await prisma.category.upsert({
      where: { slug }, update: {},
      create: { slug, name, description, sortOrder: group },
    });
    for (const [index, style] of styles[slug].entries()) {
      const [color, tone] = palettes[(group + index) % palettes.length];
      const productSlug = `${slug}-${color.toLowerCase().replaceAll(' ', '-')}-${style.toLowerCase().replaceAll(' ', '-')}`;
      const price = 899 + ((group * 5 + index * 3) % 12) * 210;
      const product = await prisma.product.upsert({
        where: { slug: productSlug }, update: {},
        create: {
          sku: `AUR-${String(group + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
          slug: productSlug, name: `${color} ${style}`, categoryId: category.id,
          color, tone, fabric: index % 2 ? 'Viscose blend' : 'Cotton blend',
          price: price * 100, mrp: (price + 600 + index * 120) * 100,
          description: `An original AURELIA concept in ${color.toLowerCase()}. This is a demo product; material, fit, availability and price must be confirmed before sales begin.`,
          published: false,
        },
      });
      await prisma.productVariant.createMany({
        data: sizes.map(size => ({ productId: product.id, size, color, sku: `${product.sku}-${size}` })),
        skipDuplicates: true,
      });
    }
  }
  console.log('Seeded 9 categories and 54 original demo products (unpublished; no photos or inventory).');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
