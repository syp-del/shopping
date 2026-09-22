import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutWidget } from "./CheckoutWidget";
import { formatKRW, type Order, type OrderItem } from "@/lib/types";

export default async function CheckoutPage(props: PageProps<"/checkout">) {
  const { orderNo } = await props.searchParams;
  if (typeof orderNo !== "string") notFound();

  // 비회원 주문은 RLS로 읽을 수 없으므로 서버에서 관리자 클라이언트로 읽는다.
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();

  const order = data as Order | null;
  if (!order) notFound();

  // 이미 결제된 주문으로 다시 들어오면 결제창을 띄우지 않고 주문 상세로 보낸다.
  if (order.status === "paid" || order.status === "canceled") {
    redirect(`/orders/${order.order_no}`);
  }

  const { data: itemRows } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const items = (itemRows ?? []) as OrderItem[];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <p className="label">CHECKOUT</p>
      <h1 className="font-display mt-3 text-[22px]">결제하기</h1>
      <p className="text-clay mt-3 font-mono text-[11px]">주문번호 {order.order_no}</p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <CheckoutWidget
            orderNo={order.order_no}
            amount={order.amount}
            orderName={order.order_name}
            customerName={order.customer_name}
            customerEmail={order.customer_email}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-sand bg-linen rounded-[2px] border p-6">
            <h2 className="font-display text-[15px]">주문 요약</h2>

            <ul className="divide-sand mt-5 divide-y text-[13px]">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3">
                  <span className="text-clay">
                    {item.name}
                    <span className="text-clay/60"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0">
                    {formatKRW(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-sand mt-5 flex justify-between border-t pt-5">
              <span className="text-bark">최종 결제 금액</span>
              <span className="font-display text-bark text-[15px]">
                {formatKRW(order.amount)}
              </span>
            </div>

            <p className="text-clay mt-5 text-[11px] leading-relaxed">
              이 금액은 서버가 상품 가격을 다시 계산해 저장해 둔 값입니다. 결제
              승인 단계에서 이 값과 다르면 승인이 거부됩니다.
            </p>

            <Link
              href="/cart"
              className="text-clay hover:text-bark mt-5 block text-center text-[11px] transition"
            >
              장바구니로 돌아가기
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
