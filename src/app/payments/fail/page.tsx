import Link from "next/link";
import { toKoreanMessage } from "@/lib/toss";

/**
 * 결제 실패 페이지.
 *
 * 토스가 failUrl로 리다이렉트할 때 code / message / orderId를 붙여준다.
 * 사용자가 결제창을 닫은 경우(PAY_PROCESS_CANCELED)에는 orderId가 없을 수도 있다.
 *
 * 중요: 여기서는 결제 승인 API를 호출하지 않는다. 인증 자체가 실패했기 때문이다.
 */
export default async function PaymentFailPage(
  props: PageProps<"/payments/fail">,
) {
  const { code, message, orderId } = await props.searchParams;

  const errorCode = typeof code === "string" ? code : "UNKNOWN_ERROR";
  const rawMessage =
    typeof message === "string" ? message : "결제를 완료하지 못했습니다.";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-start px-4 pt-32 pb-20">
      <span className="grid h-14 w-14 place-items-center rounded-[2px] bg-red-950/40 text-[17px] text-red-400">
        !
      </span>

      <h1 className="font-display mt-6 text-[22px]">결제 실패</h1>
      <p className="text-clay mt-3 text-[13px]">
        {toKoreanMessage(errorCode, rawMessage)}
      </p>

      <dl className="border-sand mt-8 w-full space-y-2 border-t pt-6 font-mono text-[11px]">
        <div className="flex justify-between gap-6">
          <dt className="text-clay">code</dt>
          <dd className="text-right">{errorCode}</dd>
        </div>
        {typeof orderId === "string" && (
          <div className="flex justify-between gap-6">
            <dt className="text-clay">주문번호</dt>
            <dd className="text-right">{orderId}</dd>
          </div>
        )}
      </dl>

      <p className="text-clay/70 mt-6 text-[11px] leading-relaxed">
        결제가 승인되지 않았으므로 금액이 청구되지 않았습니다. 장바구니 내용은
        그대로 남아 있습니다.
      </p>

      <div className="mt-10 flex w-full gap-3">
        <Link
          href="/cart"
          className="bg-bark flex-1 rounded-[2px] py-3.5 text-center text-[13px] text-paper transition hover:opacity-85"
        >
          다시 결제하기
        </Link>
        <Link
          href="/#shop"
          className="border-sand hover:border-bark/60 rounded-[2px] border px-6 py-3.5 text-[13px] transition"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}
