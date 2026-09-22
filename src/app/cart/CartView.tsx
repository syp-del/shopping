"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrder } from "@/app/actions/order";
import {
  cartTotal,
  removeFromCart,
  setQuantity,
  useCart,
  type CartItem,
} from "@/lib/cart";
import { formatKRW } from "@/lib/types";
import { shippingFeeFor } from "@/lib/constants";

export function CartView({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const { items, loaded } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = cartTotal(items);
  const shipping = items.length === 0 ? 0 : shippingFeeFor(subtotal);

  function submit() {
    setError(null);
    startTransition(async () => {
      // 서버에는 상품 id와 수량만 보낸다. 금액은 서버가 DB에서 다시 계산한다.
      const result = await createOrder(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        { name, email },
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/checkout?orderNo=${result.orderNo}`);
    });
  }

  if (!loaded) {
    return <div className="min-h-[60vh] pt-28" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 pt-28 pb-20 text-center">
        <h1 className="font-display text-[22px]">장바구니가 비어 있습니다</h1>
        <p className="text-clay mt-4 text-[13px]">
          오래 두고 쓸 물건을 천천히 골라보세요.
        </p>
        <Link
          href="/#shop"
          className="bg-bark mt-8 rounded-[2px] px-8 py-3 text-[13px] text-paper transition hover:opacity-85"
        >
          상품 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <p className="label">CART</p>
      <h1 className="font-display mt-3 text-[22px]">장바구니</h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="divide-sand divide-y">
          {items.map((item) => (
            <CartRow key={item.productId} item={item} />
          ))}
        </ul>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-sand bg-linen rounded-[2px] border p-6">
            <h2 className="font-display text-[15px]">주문 정보</h2>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="text-clay mb-2 block text-[11px]">
                  주문자 이름
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="border-sand focus:border-bark w-full rounded-[2px] border bg-linen px-4 py-3 text-[13px] outline-none transition"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-clay mb-2 block text-[11px]">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="border-sand focus:border-bark w-full rounded-[2px] border bg-linen px-4 py-3 text-[13px] outline-none transition"
                  placeholder="hello@example.com"
                />
              </div>
            </div>

            <dl className="border-sand mt-6 space-y-2 border-t pt-6 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-clay">상품 금액</dt>
                <dd>{formatKRW(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-clay">배송비</dt>
                <dd>{shipping === 0 ? "무료" : formatKRW(shipping)}</dd>
              </div>
              <div className="border-sand mt-3 flex justify-between border-t pt-3">
                <dt className="text-bark">결제 예정 금액</dt>
                <dd className="font-display text-bark text-[15px]">
                  {formatKRW(subtotal + shipping)}
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 rounded-[2px] border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="bg-bark mt-6 w-full rounded-[2px] py-4 text-[13px] text-paper transition hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "주문서 만드는 중…" : "주문하기"}
            </button>

            <p className="text-clay mt-4 text-center text-[11px]">
              로그인하지 않아도 결제할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  return (
    <li className="flex gap-5 py-6">
      <Link
        href={`/products/${item.productId}`}
        className="border-sand bg-linen h-28 w-24 shrink-0 overflow-hidden rounded-[2px] border"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="from-linen to-sand h-full w-full bg-gradient-to-br" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/products/${item.productId}`}
            className="hover:text-ochre text-[13px] transition"
          >
            {item.name}
          </Link>
          <p className="font-display mt-1 text-[14px]">{formatKRW(item.price)}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="border-sand flex items-center rounded-[2px] border">
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              className="text-clay hover:text-bark px-3 py-1.5 transition"
              aria-label="수량 줄이기"
            >
              −
            </button>
            <span className="w-8 text-center text-[13px]">{item.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              className="text-clay hover:text-bark px-3 py-1.5 transition"
              aria-label="수량 늘리기"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeFromCart(item.productId)}
            className="text-clay text-[11px] transition hover:text-red-400"
          >
            삭제
          </button>
        </div>
      </div>

      <p className="font-display self-center text-[14px]">
        {formatKRW(item.price * item.quantity)}
      </p>
    </li>
  );
}
