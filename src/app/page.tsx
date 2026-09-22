import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, HERO_IMAGE, BANNER_IMAGE } from "@/lib/constants";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/types";

const NOTES = [
  {
    no: "01",
    title: "소재부터 고릅니다",
    body: "원목, 리넨, 도자. 시간이 지날수록 자연스러워지는 소재만 씁니다.",
  },
  {
    no: "02",
    title: "오래 쓰는 형태",
    body: "유행을 덜 타는 담백한 형태로, 어느 집에 두어도 겉돌지 않게.",
  },
  {
    no: "03",
    title: "덜 만듭니다",
    body: "한 번에 많이 만들지 않습니다. 대신 오래 만듭니다.",
  },
];

export default async function HomePage(props: PageProps<"/">) {
  const { category } = await props.searchParams;
  const selected = typeof category === "string" ? category : null;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (selected) query = query.eq("category", selected);

  const { data } = await query;
  const products = (data ?? []) as Product[];

  return (
    <>
      {/* ── 히어로 ─────────────────────────────── */}
      <section className="relative flex h-screen min-h-[560px] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="ken-burns absolute inset-0 h-full w-full object-cover"
        />
        {/* 글자가 놓이는 아래쪽만 종이색으로 덮고, 사진은 최대한 그대로 보여준다 */}
        <div className="from-paper via-paper/25 absolute inset-0 bg-gradient-to-t from-40% via-58% to-transparent" />

        <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-28 sm:px-10">
          <p className="rise label" style={{ animationDelay: "200ms" }}>
            Plain · Home &amp; Living
          </p>

          <h1
            className="rise font-display mt-10 text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[2]"
            style={{ animationDelay: "420ms" }}
          >
            오래 두고 쓰는 것들
          </h1>

          <p
            className="rise text-clay mt-5 max-w-sm text-[13px] leading-loose"
            style={{ animationDelay: "640ms" }}
          >
            집을 조용히 채우는 살림과 소재를 고릅니다.
          </p>

          <div
            className="rise mt-12 flex flex-wrap gap-3"
            style={{ animationDelay: "860ms" }}
          >
            <Link href="#shop" className="btn btn-solid">
              전체 보기
            </Link>
          </div>
        </div>

        <div className="bg-clay/40 scroll-hint absolute bottom-0 left-1/2 hidden h-16 w-px sm:block" />
      </section>

      {/* ── 한 문장 ────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-6 py-40 text-center sm:px-10">
        <Reveal>
          <p className="font-display text-[clamp(1.1rem,1.9vw,1.4rem)] leading-[2.4]">
            새것일 때 가장 예쁜 물건보다,
            <br />
            몇 해를 쓰고 나서 더 손이 가는 물건을.
          </p>
        </Reveal>
      </section>

      {/* ── 노트 ───────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="border-sand grid gap-px border-t md:grid-cols-3">
          {NOTES.map((note, index) => (
            <Reveal key={note.no} delay={index * 140}>
              <div className="border-sand py-14 md:border-r md:pr-10 md:last:border-r-0">
                <p className="text-clay text-[11px] tracking-[0.25em]">
                  {note.no}
                </p>
                <h3 className="font-display mt-6 text-[15px]">{note.title}</h3>
                <p className="text-clay mt-3 text-[13px] leading-loose">
                  {note.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 상품 ───────────────────────────────── */}
      <section
        id="shop"
        className="mx-auto max-w-[1400px] scroll-mt-24 px-6 py-32 sm:px-10"
      >
        <Reveal>
          <p className="label">The Collection</p>
          <h2 className="font-display mt-6 text-[22px]">
            {selected ?? "전체 상품"}
            <span className="text-clay ml-3 text-[13px]">{products.length}</span>
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <nav className="mt-12 flex flex-wrap gap-x-7 gap-y-3">
            <CategoryLink href="/#shop" label="전체" active={selected === null} />
            {CATEGORIES.map((name) => (
              <CategoryLink
                key={name}
                href={`/?category=${encodeURIComponent(name)}#shop`}
                label={name}
                active={selected === name}
              />
            ))}
          </nav>
        </Reveal>

        {products.length === 0 ? (
          <p className="text-clay mt-28 text-center text-[13px]">
            이 카테고리에는 아직 상품이 없습니다.
          </p>
        ) : (
          <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-20 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 110}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── 닫는 화면 ──────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 pb-24 sm:px-10">
        <div className="grid items-center gap-16 md:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <div className="bg-linen aspect-[5/4] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BANNER_IMAGE}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="md:pl-6">
              <p className="label">About Plain</p>
              <h3 className="font-display mt-8 text-[clamp(1.1rem,1.7vw,1.35rem)] leading-[2.1]">
                좋은 물건은
                <br />
                천천히 익숙해집니다
              </h3>
              <p className="text-clay mt-7 text-[13px] leading-loose">
                플레인은 집에서 오래 쓰이는 것들을 만듭니다. 처음 놓았을 때보다
                몇 계절이 지난 뒤가 더 좋아지도록, 소재와 형태를 덜어내는 쪽으로
                고민합니다.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function CategoryLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`pb-1 text-[13px] transition-colors duration-500 ${
        active
          ? "border-bark text-bark border-b"
          : "text-clay hover:text-bark border-b border-transparent"
      }`}
    >
      {label}
    </Link>
  );
}
