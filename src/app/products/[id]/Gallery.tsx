import { ProductImage } from "@/components/ProductCard";
import { sizedImage, type Product } from "@/lib/types";

/**
 * 세로 나열 갤러리. 추가 컷이 없는 상품은 대표컷 한 장만 나와
 * 기존 상세페이지와 같은 모습으로 자연스럽게 축약된다.
 */
export function Gallery({ product }: { product: Product }) {
  const shots = [product.image_url, ...product.gallery].filter(
    (src): src is string => Boolean(src),
  );

  if (shots.length === 0) {
    return (
      <div className="bg-linen aspect-square overflow-hidden">
        <ProductImage product={product} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shots.map((src, index) => (
        <div
          key={src}
          className={`bg-linen overflow-hidden ${
            index === 0 ? "aspect-square" : "aspect-4/5"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sizedImage(src, 1200)}
            alt={`${product.name} ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
