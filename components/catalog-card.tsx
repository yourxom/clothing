import Link from "next/link";
import { FashionPlaceholder } from "@/components/fashion-placeholder";
import { formatPrice, type Product } from "@/lib/catalog";

export function CatalogCard({ product }: { product: Product }) {
  return <article className="catalog-card">
    <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="catalog-card-media">
      <FashionPlaceholder label={`${product.name} demo artwork`} tone={product.tone} />
      <span className="catalog-card-cta" aria-hidden="true">Discover piece <span>↗</span></span>
    </Link>
    <div className="catalog-card-copy">
      <p className="catalog-card-overline">AURELIA · {product.color}</p>
      <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
      <p className="catalog-price">{formatPrice(product.price)} <del>{formatPrice(product.mrp)}</del></p>
      <p className="catalog-card-disclaimer">Demo product · Not available to purchase</p>
    </div>
  </article>;
}
