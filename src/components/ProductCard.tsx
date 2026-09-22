import Link from "next/link";
import { formatKRW, type Product } from "@/lib/types";

export function ProductImage({
  product,
  className = "",
}: {
  product: Pick<Product, "name" | "image_url">;
  className?: string;
}) {
  if (!product.image_url) {
    return (
      <div
        className={`bg-linen flex h-full w-full items-center justify-center p-10 ${className}`}
      >
        <span className="font-display text-clay/70 text-center text-sm leading-loose">
          {product.name}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image_url}
      alt={product.name}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-linen relative aspect-square overflow-hidden">
        <ProductImage
          product={product}
          className="transition-opacity duration-700 group-hover:opacity-90"
        />

        {soldOut && (
          <div className="bg-paper/75 absolute inset-0 grid place-items-center">
            <span className="text-clay text-[11px] tracking-[0.25em]">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-[13px] leading-relaxed">{product.name}</h3>
        <p className="text-clay mt-1.5 text-[13px]">
          {formatKRW(product.price)}
        </p>
      </div>
    </Link>
  );
}
