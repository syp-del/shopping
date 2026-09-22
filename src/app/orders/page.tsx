import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKRW, type Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS 정책(user_id = auth.uid()) 덕분에 본인 주문만 조회된다.
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <p className="label">ORDERS</p>
      <h1 className="font-display mt-3 text-[22px]">주문내역</h1>
      <p className="text-clay mt-3 text-[13px]">{user.email}</p>

      {orders.length === 0 ? (
        <div className="border-sand mt-12 rounded-[2px] border border-dashed py-20 text-center">
          <p className="text-clay text-[13px]">아직 주문한 상품이 없습니다.</p>
          <Link
            href="/#shop"
            className="bg-bark mt-6 inline-block rounded-[2px] px-8 py-3 text-[13px] text-paper transition hover:opacity-85"
          >
            상품 보러가기
          </Link>
        </div>
      ) : (
        <ul className="mt-12 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.order_no}`}
                className="border-sand hover:border-bark/50 block rounded-[2px] border p-6 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-clay font-mono text-[11px]">
                        {order.order_no}
                      </span>
                    </div>
                    <p className="mt-3">{order.order_name}</p>
                    <p className="text-clay mt-1 text-[11px]">
                      {new Date(order.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <p className="font-display text-[15px]">
                    {formatKRW(order.amount)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
