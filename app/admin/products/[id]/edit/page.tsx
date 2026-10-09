import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { COLOR_OPTIONS, SIZE_OPTIONS, FABRIC_OPTIONS } from "@/lib/product-admin";
import { COLOR_META } from "@/lib/catalog";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminImageManager } from "@/components/admin-image-manager";
import { AdminProductDelete } from "@/components/admin-product-delete";

export const metadata: Metadata = { title: "Edit Product — Admin" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const { id } = await params;

  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true } },
        variants: { select: { size: true, color: true } },
        images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, isPrimary: true, color: true } },
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);

  if (!product) notFound();

  const colors = [...new Set(product.variants.map(v => v.color))];
  const sizes = [...new Set(product.variants.map(v => v.size))];
  const colorOptions = COLOR_OPTIONS.map(c => ({ name: c.name, hex: COLOR_META[c.name]?.hex ?? "#C98A80" }));

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb" style={{ marginBottom: "1rem", fontSize: ".8rem" }}>
        <Link href="/admin/products" className="admin-table-link">← Back to products</Link>
      </nav>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>Edit product</h1>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <Link href={`/products/${product.slug}`} target="_blank" className="button button-outline"
            style={{ minHeight: "36px", padding: ".4rem .9rem", fontSize: ".76rem" }}>
            View in store ↗
          </Link>
          <AdminProductDelete productId={product.id} productName={product.name} redirectTo="/admin/products" />
        </div>
      </div>
      <p className="muted" style={{ margin: ".4rem 0 2rem", fontSize: ".8rem" }}>SKU {product.sku} · /{product.slug}</p>

      <AdminProductForm
        mode="edit"
        categories={categories}
        colorOptions={colorOptions}
        sizeOptions={[...SIZE_OPTIONS]}
        fabricOptions={[...FABRIC_OPTIONS]}
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          categorySlug: product.category.slug,
          fabric: product.fabric,
          price: Math.round(product.price / 100),
          mrp: Math.round(product.mrp / 100),
          published: product.published,
          colors,
          sizes,
        }}
      />

      <section className="admin-settings-section" style={{ marginTop: "2.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">🖼️</span>
          <div>
            <h2 className="admin-settings-title">Product images</h2>
            <p className="admin-settings-sub">
              Add images by URL. The main image is shown on the store; others appear in the gallery.
            </p>
          </div>
        </div>
        <AdminImageManager productId={product.id} categorySlug={product.category.slug} initialImages={product.images} colours={colors} />
      </section>
    </div>
  );
}
