import type { Metadata } from "next";
import { db } from "@/lib/db";
import { InventoryEditor } from "@/components/inventory-editor";

export const metadata: Metadata = { title: "Inventory — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await db.product.findMany({
    orderBy: [{ category: { slug: "asc" } }, { name: "asc" }],
    include: {
      category: { select: { name: true } },
      variants:  {
        orderBy: [{ color: "asc" }, { size: "asc" }],
        include: { inventory: true },
      },
    },
  });

  const items = products.flatMap(p =>
    p.variants.map(v => ({
      productId:   p.id,
      productName: p.name,
      category:    p.category.name,
      variantId:   v.id,
      sku:         v.sku,
      size:        v.size,
      color:       v.color,
      quantity:    v.inventory?.quantity ?? 0,
      inventoryId: v.inventory?.id ?? null,
    }))
  );

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Inventory <span className="admin-count">({items.length} variants)</span>
      </h1>
      <p className="muted" style={{ marginBottom:"1.5rem", fontSize:".85rem" }}>
        Set stock quantities for each size variant. Changes save immediately per row.
      </p>
      <InventoryEditor items={items} />
    </div>
  );
}
