"use client";

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";

type TossPaymentsInstance = Awaited<ReturnType<typeof loadTossPayments>>;
type PaymentWidgets = ReturnType<TossPaymentsInstance["widgets"]>;

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export function CheckoutWidget({
  orderNo,
  amount,
  orderName,
  customerName,
  customerEmail,
}: {
  orderNo: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
}) {
  const [widgets, setWidgets] = useState<PaymentWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderedRef = useRef(false);

  // 1단계: SDK를 불러와 위젯 인스턴스를 만든다.
  //   customerKey에 이메일·회원ID처럼 추측 가능한 값을 쓰면 안 된다.
  //   카드를 저장하지 않는 일회성 결제이므로 ANONYMOUS를 쓴다.
  useEffect(() => {
    let canceled = false;

    loadTossPayments(CLIENT_KEY)
      .then((tossPayments) => {
        if (canceled) return;
        setWidgets(tossPayments.widgets({ customerKey: ANONYMOUS }));
      })
      .catch(() => {
        if (!canceled) setError("결제 모듈을 불러오지 못했습니다.");
      });

    return () => {
      canceled = true;
    };
  }, []);

  // 2단계: 금액을 먼저 정하고 결제수단 UI를 그린다.
  //   setAmount는 반드시 render/requestPayment보다 먼저 호출해야 한다.
  //   결제수단 위젯은 한 페이지에 하나만 존재할 수 있어서, 개발 모드의 이중 렌더를 ref로 막는다.
  useEffect(() => {
    if (!widgets || renderedRef.current) return;
    renderedRef.current = true;

    (async () => {
      try {
        await widgets.setAmount({ currency: "KRW", value: amount });
        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#payment-method",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          }),
        ]);
        setReady(true);
      } catch {
        setError("결제 수단을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      }
    })();
  }, [widgets, amount]);

  // 3단계: 결제창을 띄운다.
  //   여기서 돈이 빠져나가는 게 아니라 "인증"만 끝난다.
  //   인증이 끝나면 토스가 successUrl로 리다이렉트시키고, 거기서 서버가 승인을 마무리한다.
  async function requestPayment() {
    if (!widgets) return;
    setError(null);

    try {
      await widgets.requestPayment({
        orderId: orderNo,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch {
      // 사용자가 결제창을 닫은 경우도 여기로 온다. 실패 페이지 이동은 토스가 처리한다.
      setError("결제를 진행하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div>
      {/* 토스 위젯은 흰 화면으로 그려진다. 어두운 페이지 위에 떠 보이지 않도록
          일부러 밝은 패널로 감싸 결제 영역처럼 보이게 한다. */}
      <div className="overflow-hidden rounded-[3px] bg-white p-2">
        <div id="payment-method" />
        <div id="agreement" />
      </div>

      {error && (
        <p className="mt-5 rounded-[2px] border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={requestPayment}
        disabled={!ready}
        className="bg-bark mt-6 w-full rounded-[2px] py-4 text-[13px] text-paper transition hover:opacity-85 disabled:opacity-40"
      >
        {ready ? "결제하기" : "결제창 준비 중…"}
      </button>

      <div className="border-sand bg-linen/60 mt-6 rounded-[2px] border p-5">
        <p className="text-ochre text-[11px] tracking-[0.2em]">TEST MODE</p>
        <p className="text-clay mt-3 text-[11px] leading-relaxed">
          토스페이먼츠 <strong className="text-bark">테스트 키</strong>로 동작합니다.
          결제창에서 끝까지 진행해도 <strong className="text-bark">실제로 돈이
          빠져나가지 않습니다.</strong> 테스트 환경에서는 카드·계좌이체·간편결제를
          쓸 수 있고, 가상계좌와 카카오페이는 별도 계약 키가 필요해 동작하지
          않습니다.
        </p>
      </div>
    </div>
  );
}
