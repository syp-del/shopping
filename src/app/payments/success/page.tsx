import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmPayment, toKoreanMessage, type TossPayment } from "@/lib/toss";
import { formatKRW, type Order } from "@/lib/types";
import { ClearCart } from "./ClearCart";

/**
 * 결제 승인 페이지.
 *
 * 사용자가 결제창에서 인증을 마치면 토스가 이 주소로 리다이렉트시킨다.
 *   /payments/success?paymentType=NORMAL&orderId=...&paymentKey=...&amount=...
 *
 * 이 시점에는 아직 결제가 확정되지 않았다. 서버가 승인 API를 호출해야 비로소 결제가 끝난다.
 * 그 전에 반드시 금액을 검증한다.
 */
export default async function PaymentSuccessPage(
  props: PageProps<"/payments/success">,
) {
  const { paymentKey, orderId, amount } = await props.searchParams;

  if (
    typeof paymentKey !== "string" ||
    typeof orderId !== "string" ||
    typeof amount !== "string"
  ) {
    return (
      <Failed
        code="INVALID_CALLBACK"
        message="결제 정보가 올바르지 않습니다. 장바구니에서 다시 주문해 주세요."
      />
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("order_no", orderId)
    .maybeSingle();

  const order = data as Order | null;

  if (!order) {
    return <Failed code="ORDER_NOT_FOUND" message="주문을 찾을 수 없습니다." />;
  }

  // ① 이미 승인이 끝난 주문이면 다시 승인하지 않는다.
  //    (성공 페이지를 새로고침해도 두 번 결제되지 않게 하는 방어)
  if (order.status === "paid") {
    return <Paid order={order} alreadyPaid />;
  }

  // ② 금액 검증 — 쿼리스트링의 amount는 브라우저에서 조작할 수 있으므로 믿지 않는다.
  //    주문을 만들 때 서버가 계산해 DB에 저장한 금액과 다르면 승인하지 않는다.
  if (Number(amount) !== order.amount) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return (
      <Failed
        code="AMOUNT_MISMATCH"
        message={toKoreanMessage("AMOUNT_MISMATCH", "")}
        detail={`요청된 금액 ${formatKRW(Number(amount))} ≠ 주문 금액 ${formatKRW(order.amount)}`}
      />
    );
  }

  // ③ 승인 요청. body의 amount도 쿼리값이 아니라 DB에 저장된 금액을 보낸다.
  const result = await confirmPayment({
    paymentKey,
    orderId: order.order_no,
    amount: order.amount,
    idempotencyKey: order.idempotency_key,
  });

  if (!result.ok) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return (
      <Failed
        code={result.error.code}
        message={toKoreanMessage(result.error.code, result.error.message)}
      />
    );
  }

  // ④ 승인 성공 — 재고를 차감하고 주문을 paid로 바꾼다. (하나의 트랜잭션)
  const { error } = await admin.rpc("mark_order_paid", {
    p_order_no: order.order_no,
    p_payment_key: result.payment.paymentKey,
  });

  if (error) {
    return (
      <Failed
        code="ORDER_UPDATE_FAILED"
        message="결제는 승인됐지만 주문 상태를 저장하지 못했습니다. 고객센터로 문의해 주세요."
      />
    );
  }

  return <Paid order={order} payment={result.payment} />;
}

function Paid({
  order,
  payment,
  alreadyPaid = false,
}: {
  order: Order;
  payment?: TossPayment;
  alreadyPaid?: boolean;
}) {
  return (
    <Shell>
      <ClearCart />

      <span className="bg-bark grid h-14 w-14 place-items-center rounded-[2px] text-[17px] text-paper">
        ✓
      </span>
      <h1 className="font-display mt-6 text-[22px]">결제 완료</h1>
      <p className="text-clay mt-3 text-[13px]">
        {alreadyPaid
          ? "이미 승인이 끝난 주문입니다. 중복으로 결제되지 않았습니다."
          : "주문이 정상적으로 접수됐습니다."}
      </p>

      <dl className="border-sand mt-10 w-full space-y-3 border-t pt-8 text-[13px]">
        <Row label="주문번호" value={order.order_no} mono />
        <Row label="주문명" value={order.order_name} />
        <Row label="결제 금액" value={formatKRW(order.amount)} highlight />
        {payment?.method && <Row label="결제 수단" value={payment.method} />}
        {payment?.card && (
          <Row
            label="카드"
            value={`${payment.card.number}${
              payment.card.installmentPlanMonths > 0
                ? ` / ${payment.card.installmentPlanMonths}개월`
                : " / 일시불"
            }`}
          />
        )}
      </dl>

      <div className="mt-10 flex w-full flex-wrap gap-3">
        <Link
          href={`/orders/${order.order_no}`}
          className="bg-bark flex-1 rounded-[2px] py-3.5 text-center text-[13px] text-paper transition hover:opacity-85"
        >
          주문 상세 보기
        </Link>
        {payment?.receipt?.url && (
          <a
            href={payment.receipt.url}
            target="_blank"
            rel="noreferrer"
            className="border-sand hover:border-bark/60 rounded-[2px] border px-6 py-3.5 text-[13px] transition"
          >
            영수증
          </a>
        )}
        <Link
          href="/#shop"
          className="border-sand hover:border-bark/60 rounded-[2px] border px-6 py-3.5 text-[13px] transition"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </Shell>
  );
}

function Failed({
  code,
  message,
  detail,
}: {
  code: string;
  message: string;
  detail?: string;
}) {
  return (
    <Shell>
      <span className="grid h-14 w-14 place-items-center rounded-[2px] bg-red-950/40 text-[17px] text-red-400">
        !
      </span>
      <h1 className="font-display mt-6 text-[22px]">결제 실패</h1>
      <p className="text-clay mt-3 text-[13px]">{message}</p>
      {detail && <p className="text-clay/70 mt-2 font-mono text-[11px]">{detail}</p>}
      <p className="text-clay/60 mt-4 font-mono text-[11px]">code: {code}</p>

      <div className="mt-10 flex w-full gap-3">
        <Link
          href="/cart"
          className="bg-bark flex-1 rounded-[2px] py-3.5 text-center text-[13px] text-paper transition hover:opacity-85"
        >
          장바구니로 돌아가기
        </Link>
        <Link
          href="/#shop"
          className="border-sand hover:border-bark/60 rounded-[2px] border px-6 py-3.5 text-[13px] transition"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-start px-4 pt-32 pb-20">
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-clay shrink-0">{label}</dt>
      <dd
        className={`text-right ${mono ? "font-mono text-[11px]" : ""} ${
          highlight ? "font-display text-bark text-[14px]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
