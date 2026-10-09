import Link from "next/link";
import { ProductMedia } from "@/components/product-media";
import { SavePreview, ComparePreview } from "@/components/preview-actions";
import { formatPrice, type Product } from "@/lib/catalog";

export function CatalogCard({ product }: { product: Product }) {
  const discount = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <article className="catalog-card">
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="catalog-card-media"
      >
        <ProductMedia src={product.image} alt={product.name} tone={product.tone} />
        <span className="catalog-card-cta" aria-hidden="true">
          View details <span>↗</span>
        </span>
        {discount > 0 && (
          <span className="catalog-card-badge" aria-label={`${discount}% off`}>
            {discount}% off
          </span>
        )}
      </Link>

      <div className="catalog-card-copy">
        <p className="catalog-card-overline">{product.color} · {product.fabric}</p>
        <h3>
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="catalog-price">
          {formatPrice(product.price)}
          {product.mrp > product.price && <del>{formatPrice(product.mrp)}</del>}
        </p>
        <div className="catalog-card-actions">
          <SavePreview    slug={product.slug} name={product.name} />
          <ComparePreview slug={product.slug} name={product.name} />
        </div>
      </div>
    </article>
  );
}
