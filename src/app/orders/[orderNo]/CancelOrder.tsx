"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrder } from "@/app/actions/order";

const REASONS = ["단순 변심", "사이즈 변경", "배송 지연", "상품 정보 상이"];

export function CancelOrder({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-sand mt-10 w-full rounded-[2px] border py-4 text-[13px] transition hover:border-red-500/50 hover:text-red-300"
      >
        결제 취소하기
      </button>
    );
  }

  return (
    <div className="border-sand bg-linen mt-10 rounded-[2px] border p-6">
      <h2 className="font-display text-[15px]">결제를 취소할까요?</h2>
      <p className="text-clay mt-2 text-[13px]">
        토스페이먼츠에 취소를 요청하고 재고를 되돌립니다. 취소 후에는 되돌릴 수
        없습니다.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {REASONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setReason(item)}
            className={`rounded-[2px] border px-4 py-2 text-[11px] transition ${
              reason === item
                ? "border-bark bg-bark text-paper"
                : "border-sand text-clay hover:border-white/40"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-[2px] border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await cancelOrder(orderNo, reason);
              if (!result.ok) {
                setError(result.message);
                return;
              }
              router.refresh();
            });
          }}
          className="flex-1 rounded-[2px] bg-red-500/90 py-3.5 text-[13px] text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? "취소 처리 중…" : "취소 확정"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="border-sand hover:border-bark/60 rounded-[2px] border px-6 py-3.5 text-[13px] transition disabled:opacity-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
