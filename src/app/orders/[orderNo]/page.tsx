import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { CancelOrder } from "./CancelOrder";
import { formatKRW, type Order, type OrderItem } from "@/lib/types";

export default async function OrderDetailPage(
  props: PageProps<"/orders/[orderNo]">,
) {
  const { orderNo } = await props.params;

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();

  const order = data as Order | null;
  if (!order) notFound();

  // 회원 주문은 본인만 볼 수 있다.
  // 비회원 주문은 추측하기 어려운 주문번호를 아는 사람만 접근할 수 있다.
  if (order.user_id) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== order.user_id) notFound();
  }

  const { data: itemRows } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const items = (itemRows ?? []) as OrderItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <Link
        href="/orders"
        className="text-clay hover:text-bark text-[11px] transition"
      >
        ← 주문내역
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <OrderStatusBadge status={order.status} />
        <span className="text-clay font-mono text-[11px]">{order.order_no}</span>
      </div>

      <h1 className="font-display mt-4 text-[22px]">{order.order_name}</h1>

      <ul className="divide-sand border-sand mt-10 divide-y border-y">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-6 py-4">
            <div>
              <p className="text-[13px]">{item.name}</p>
              <p className="text-clay mt-1 text-[11px]">
                {formatKRW(item.price)} × {item.quantity}
              </p>
            </div>
            <p className="font-display self-center text-[14px]">
              {formatKRW(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-8 space-y-3 text-[13px]">
        <Row label="주문자" value={order.customer_name} />
        <Row label="연락처" value={order.customer_phone} />
        <Row label="이메일" value={order.customer_email} />
        <Row
          label="배송지"
          value={`(${order.postal_code}) ${order.address1}${
            order.address2 ? ` ${order.address2}` : ""
          }`}
        />
        {order.delivery_note && (
          <Row label="요청사항" value={order.delivery_note} />
        )}
        <Row
          label="주문일시"
          value={new Date(order.created_at).toLocaleString("ko-KR")}
        />
        {order.paid_at && (
          <Row
            label="결제일시"
            value={new Date(order.paid_at).toLocaleString("ko-KR")}
          />
        )}
        {order.canceled_at && (
          <>
            <Row
              label="취소일시"
              value={new Date(order.canceled_at).toLocaleString("ko-KR")}
            />
            {order.cancel_reason && (
              <Row label="취소사유" value={order.cancel_reason} />
            )}
          </>
        )}
        <div className="border-sand flex justify-between border-t pt-4">
          <dt className="text-bark">
            {order.status === "canceled" ? "환불 금액" : "결제 금액"}
          </dt>
          <dd className="font-display text-bark text-[17px]">
            {formatKRW(order.amount)}
          </dd>
        </div>
      </dl>

      {order.status === "paid" && <CancelOrder orderNo={order.order_no} />}

      {order.status === "pending" && (
        <Link
          href={`/checkout?orderNo=${order.order_no}`}
          className="bg-bark mt-10 block rounded-[2px] py-4 text-center text-[13px] text-paper transition hover:opacity-85"
        >
          결제 이어서 하기
        </Link>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-clay shrink-0">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
