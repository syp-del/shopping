import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductImage } from "@/components/ProductCard";
import { AddToCart } from "./AddToCart";
import { formatKRW, type Product } from "@/lib/types";

export default async function ProductPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) notFound();
  const product = data as Product;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-32 pb-28 sm:px-10">
      <nav className="text-clay mb-12 flex items-center gap-2 text-[11px]">
        <Link
          href="/"
          className="hover:text-bark transition-colors duration-500"
        >
          홈
        </Link>
        <span className="text-sand">/</span>
        <Link
          href={`/?category=${encodeURIComponent(product.category)}#shop`}
          className="hover:text-bark transition-colors duration-500"
        >
          {product.category}
        </Link>
      </nav>

      <div className="grid gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-24">
        <div className="bg-linen aspect-square overflow-hidden">
          <ProductImage product={product} />
        </div>

        <div className="lg:pt-6">
          <p className="label">{product.brand}</p>

          <h1 className="font-display mt-7 text-[22px] leading-relaxed">
            {product.name}
          </h1>

          <p className="mt-4 text-[15px]">{formatKRW(product.price)}</p>

          <p className="text-clay mt-12 text-[13px] leading-loose">
            {product.description}
          </p>

          <dl className="border-sand mt-12 border-t text-[13px]">
            <Spec label="카테고리" value={product.category} />
            <Spec
              label="재고"
              value={product.stock > 0 ? `${product.stock}개` : "품절"}
            />
            <Spec label="배송" value="5만원 이상 무료배송" />
          </dl>

          <AddToCart product={product} />
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-sand flex justify-between border-b py-4">
      <dt className="text-clay">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
