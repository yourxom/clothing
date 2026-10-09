import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { AdminProductActions } from "@/components/admin-product-actions";

export const metadata: Metadata = { title: "Products — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: [{ category: { slug: "asc" } }, { name: "asc" }],
    include: {
      category: { select: { name: true } },
      variants:  { include: { inventory: true } },
      _count:    { select: { reviews: true } },
    },
  });

  const totalStock = (product: typeof products[number]) =>
    product.variants.reduce((s, v) => s + (v.inventory?.quantity ?? 0), 0);

  return (
    <div className="admin-page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>
          Products <span className="admin-count">({products.length})</span>
        </h1>
        <div style={{ display: "flex", gap: ".6rem" }}>
          <Link href="/admin/inventory" className="button button-outline"
            style={{ minHeight:"38px", padding:".5rem 1rem", fontSize:".78rem" }}>
            Manage inventory →
          </Link>
          <Link href="/admin/products/new" className="button"
            style={{ minHeight:"38px", padding:".5rem 1rem", fontSize:".78rem" }}>
            + New product
          </Link>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Category</th><th>Price</th>
              <th>Stock</th><th>Published</th><th>Reviews</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <Link href={`/products/${p.slug}`} className="admin-table-link" target="_blank">
                    {p.name}
                  </Link>
                  <div style={{ fontSize:".72rem", color:"var(--muted)" }}>{p.slug}</div>
                </td>
                <td style={{ fontSize:".82rem" }}>{p.category.name}</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  <span style={{
                    fontWeight: 600,
                    color: totalStock(p) === 0 ? "#8b3344" : totalStock(p) <= 5 ? "#b77b00" : "#3a7d44"
                  }}>
                    {totalStock(p)}
                  </span>
                </td>
                <td>
                  <span className={`admin-role-badge${p.published ? " admin-role-badge--admin" : ""}`}>
                    {p.published ? "Live" : "Draft"}
                  </span>
                </td>
                <td>{p._count.reviews}</td>
                <td><AdminProductActions productId={p.id} productName={p.name} published={p.published} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
