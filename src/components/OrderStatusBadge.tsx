import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "결제 대기",
    className: "border-sand text-clay",
  },
  paid: {
    label: "결제 완료",
    className: "border-ochre/40 bg-ochre/10 text-ochre",
  },
  failed: {
    label: "결제 실패",
    className: "border-red-900/50 bg-red-950/30 text-red-300",
  },
  canceled: {
    label: "결제 취소",
    className: "border-sand bg-linen text-clay",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STYLES[status];

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] ${className}`}>
      {label}
    </span>
  );
}
