import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { COLOR_OPTIONS, SIZE_OPTIONS, FABRIC_OPTIONS } from "@/lib/product-admin";
import { COLOR_META } from "@/lib/catalog";
import { AdminProductForm } from "@/components/admin-product-form";

export const metadata: Metadata = { title: "New Product — Admin" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  const colorOptions = COLOR_OPTIONS.map(c => ({ name: c.name, hex: COLOR_META[c.name]?.hex ?? "#C98A80" }));

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb" style={{ marginBottom: "1rem", fontSize: ".8rem" }}>
        <Link href="/admin/products" className="admin-table-link">← Back to products</Link>
      </nav>
      <h1 className="admin-heading">New product</h1>
      <p className="muted" style={{ marginBottom: "2rem", fontSize: ".85rem" }}>
        Create a product with its colours and sizes. Stock defaults to 5 per variant — adjust later in Inventory.
      </p>

      <AdminProductForm
        mode="create"
        categories={categories}
        colorOptions={colorOptions}
        sizeOptions={[...SIZE_OPTIONS]}
        fabricOptions={[...FABRIC_OPTIONS]}
        initial={{
          name: "",
          description: "",
          categorySlug: "",
          fabric: FABRIC_OPTIONS[0],
          price: 0,
          mrp: 0,
          published: false,
          colors: [],
          sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        }}
      />
    </div>
  );
}
