"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
import { embedPostcode } from "@/lib/postcode";

const FIELD =
  "border-sand focus:border-clay w-full rounded-[2px] border bg-linen px-4 py-3 text-[13px] outline-none transition-colors duration-300";

export function CartView({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const { items, loaded } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: defaultEmail,
    phone: "",
    postalCode: "",
    address1: "",
    address2: "",
    deliveryNote: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const postcodeBox = useRef<HTMLDivElement>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!postcodeOpen || !postcodeBox.current) return;

    embedPostcode(postcodeBox.current, {
      onComplete: (result) => {
        setForm((prev) => ({
          ...prev,
          postalCode: result.zonecode,
          address1: result.roadAddress || result.jibunAddress,
        }));
        setPostcodeOpen(false);
        setTimeout(() => document.getElementById("address2")?.focus(), 0);
      },
      onClose: () => setPostcodeOpen(false),
    }).catch(() => {
      setPostcodeOpen(false);
      setError(
        "우편번호 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    });
  }, [postcodeOpen]);

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
        form,
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/checkout?orderNo=${result.orderNo}`);
    });
  }

  if (!loaded) return <div className="min-h-[60vh] pt-28" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
        <h1 className="font-display text-[22px]">장바구니가 비어 있습니다</h1>
        <p className="text-clay mt-4 text-[13px]">
          오래 두고 쓸 물건을 천천히 골라보세요.
        </p>
        <Link href="/#shop" className="btn btn-solid mt-10">
          상품 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-32 pb-28 sm:px-10">
      <p className="label">Cart</p>
      <h1 className="font-display mt-6 text-[22px]">장바구니</h1>

      <div className="mt-14 grid gap-16 lg:grid-cols-[1fr_360px] lg:gap-20">
        <div>
          <ul className="divide-sand border-sand divide-y border-t">
            {items.map((item) => (
              <CartRow key={item.productId} item={item} />
            ))}
          </ul>

          <h2 className="font-display mt-16 text-[17px]">주문자 정보</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="주문자 이름" id="name">
              <input
                id="name"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                className={FIELD}
                placeholder="홍길동"
              />
            </Field>
            <Field label="연락처" id="phone">
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                className={FIELD}
                placeholder="010-0000-0000"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="이메일" id="email">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className={FIELD}
                  placeholder="hello@example.com"
                />
              </Field>
            </div>
          </div>

          <h2 className="font-display mt-14 text-[17px]">배송지</h2>
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <input
                value={form.postalCode}
                readOnly
                className={`${FIELD} max-w-36`}
                placeholder="우편번호"
                aria-label="우편번호"
              />
              <button
                type="button"
                onClick={() => setPostcodeOpen(true)}
                className="btn btn-line shrink-0"
              >
                우편번호 찾기
              </button>
            </div>

            <input
              value={form.address1}
              readOnly
              className={FIELD}
              placeholder="우편번호 찾기로 주소를 선택해 주세요"
              aria-label="주소"
            />

            <Field label="상세 주소" id="address2">
              <input
                id="address2"
                value={form.address2}
                onChange={(e) => set("address2")(e.target.value)}
                className={FIELD}
                placeholder="동·호수 등"
              />
            </Field>

            <Field label="배송 요청사항 (선택)" id="note">
              <input
                id="note"
                value={form.deliveryNote}
                onChange={(e) => set("deliveryNote")(e.target.value)}
                className={FIELD}
                placeholder="부재 시 문 앞에 놓아주세요"
              />
            </Field>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border-sand bg-linen rounded-[2px] border p-6">
            <h2 className="font-display text-[15px]">결제 예정</h2>

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
                <dt>결제 예정 금액</dt>
                <dd className="font-display text-[15px]">
                  {formatKRW(subtotal + shipping)}
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-5 rounded-[2px] border border-red-900/50 bg-red-950/30 px-4 py-3 text-[12px] text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn btn-solid mt-6 w-full"
            >
              {pending ? "주문서 만드는 중…" : "주문하기"}
            </button>

            <p className="text-clay mt-5 text-center text-[11px]">
              로그인하지 않아도 결제할 수 있습니다.
            </p>
          </div>
        </aside>
      </div>

      {postcodeOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-label="우편번호 찾기"
        >
          <div className="border-sand bg-paper w-full max-w-lg border">
            <div className="border-sand flex items-center justify-between border-b px-5 py-3">
              <span className="text-[13px]">우편번호 찾기</span>
              <button
                type="button"
                onClick={() => setPostcodeOpen(false)}
                className="text-clay hover:text-bark text-[13px] transition-colors duration-300"
              >
                닫기
              </button>
            </div>
            <div ref={postcodeBox} className="h-[460px] w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-clay mb-2 block text-[11px]">
        {label}
      </label>
      {children}
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  return (
    <li className="flex gap-5 py-6">
      <Link
        href={`/products/${item.productId}`}
        className="bg-linen h-28 w-24 shrink-0 overflow-hidden"
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
            className="hover:text-ochre text-[13px] transition-colors duration-500"
          >
            {item.name}
          </Link>
          <p className="text-clay mt-1.5 text-[13px]">{formatKRW(item.price)}</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="border-sand flex items-center border">
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              className="text-clay hover:text-bark px-3 py-1.5 transition-colors duration-500"
              aria-label="수량 줄이기"
            >
              −
            </button>
            <span className="w-8 text-center text-[13px]">{item.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              className="text-clay hover:text-bark px-3 py-1.5 transition-colors duration-500"
              aria-label="수량 늘리기"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeFromCart(item.productId)}
            className="text-clay text-[11px] transition-colors duration-500 hover:text-red-400"
          >
            삭제
          </button>
        </div>
      </div>

      <p className="self-center text-[13px]">
        {formatKRW(item.price * item.quantity)}
      </p>
    </li>
  );
}
