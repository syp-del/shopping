import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { Gallery } from "./Gallery";
import { AddToCart } from "./AddToCart";
import {
  formatKRW,
  sizedImage,
  type Product,
  type ProductSection,
} from "@/lib/types";

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

  const [{ data: sectionRows }, { data: relatedRows }] = await Promise.all([
    supabase
      .from("product_sections")
      .select("*")
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("category", product.category)
      .eq("is_active", true)
      .neq("id", id)
      .limit(4),
  ]);

  const sections = (sectionRows ?? []) as ProductSection[];
  const related = (relatedRows ?? []) as Product[];

  // 값이 있는 항목만 표로 낸다 — 상세 정보가 없는 상품은 표가 짧아질 뿐 깨지지 않는다.
  const specs: [string, string][] = (
    [
      ["소재", product.material],
      ["치수", product.dimensions],
      ["관리 방법", product.care],
      ["원산지", product.origin],
      ["재고", product.stock > 0 ? `${product.stock}개` : "품절"],
      ["배송", "5만원 이상 무료배송"],
    ] as [string, string | null][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-32 pb-28 sm:px-10">
      <nav className="text-clay mb-12 flex items-center gap-2 text-[11px]">
        <Link href="/" className="hover:text-bark transition-colors duration-500">
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

      {/* ── 갤러리 + 구매 정보 ─────────────────── */}
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <Gallery product={product} />

        <div className="lg:sticky lg:top-28 lg:self-start lg:pt-2">
          <p className="label">{product.brand}</p>

          <h1 className="font-display mt-7 text-[22px] leading-relaxed">
            {product.name}
          </h1>

          <p className="mt-4 text-[15px]">{formatKRW(product.price)}</p>

          <p className="text-clay mt-10 text-[13px] leading-loose">
            {product.description}
          </p>

          <AddToCart product={product} />

          <p className="text-clay/70 border-sand mt-10 border-t pt-6 text-[11px] leading-relaxed">
            5만원 이상 무료배송 · 평일 오후 2시 이전 주문은 당일 출고됩니다.
          </p>
        </div>
      </div>

      {/* ── 스토리 ─────────────────────────────── */}
      {product.story && (
        <Reveal>
          <section className="mx-auto max-w-2xl py-32 text-center">
            <p className="font-display text-[clamp(1rem,1.6vw,1.25rem)] leading-[2.4]">
              {product.story}
            </p>
          </section>
        </Reveal>
      )}

      {/* ── 이미지 + 설명 블록 ─────────────────── */}
      {sections.map((section, index) => (
        <Reveal key={section.id}>
          <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16">
            <div
              className={`bg-linen aspect-4/3 overflow-hidden ${
                index % 2 === 1 ? "md:order-2" : ""
              }`}
            >
              {section.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sizedImage(section.image_url, 1400)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className={index % 2 === 1 ? "md:order-1" : ""}>
              <h2 className="font-display text-[17px] leading-relaxed">
                {section.heading}
              </h2>
              <p className="text-clay mt-5 text-[13px] leading-loose">
                {section.body}
              </p>
            </div>
          </section>
        </Reveal>
      ))}

      {/* ── 상세 정보 ──────────────────────────── */}
      <Reveal>
        <section className="mx-auto max-w-2xl pt-28">
          <p className="label">Details</p>
          <dl className="border-sand mt-8 border-t text-[13px]">
            {specs.map(([label, value]) => (
              <div
                key={label}
                className="border-sand flex justify-between gap-8 border-b py-4"
              >
                <dt className="text-clay shrink-0">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      {/* ── 같은 카테고리 ──────────────────────── */}
      {related.length > 0 && (
        <Reveal>
          <section className="pt-32">
            <p className="label">함께 보면 좋은 {product.category}</p>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}
