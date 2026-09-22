"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cancelPayment, toKoreanMessage } from "@/lib/toss";
import { shippingFeeFor } from "@/lib/constants";
import type { Order, Product } from "@/lib/types";

export type CartLine = { productId: string; quantity: number };

const MAX_QUANTITY_PER_ITEM = 10;

/** 토스 orderId 규칙: 6~64자, 영문/숫자/-/_ 만 허용. 추측 불가능해야 비회원 주문 조회가 안전하다. */
function generateOrderNo() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `PL-${stamp}-${random}`;
}

/**
 * 주문 생성.
 *
 * 핵심: 클라이언트는 {상품 id, 수량}만 보낸다. **가격은 받지 않는다.**
 * 서버가 DB에서 가격을 다시 읽어 결제 금액을 계산하고, 그 금액만을 신뢰한다.
 * 결제 승인 단계에서 이 금액과 대조하게 된다.
 */
export async function createOrder(
  lines: CartLine[],
  customer: { name: string; email: string },
): Promise<{ ok: true; orderNo: string } | { ok: false; message: string }> {
  const name = customer.name.trim();
  const email = customer.email.trim();

  if (!name) return { ok: false, message: "주문자 이름을 입력해 주세요." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "이메일 형식을 확인해 주세요." };
  }
  if (lines.length === 0) {
    return { ok: false, message: "장바구니가 비어 있습니다." };
  }

  // 같은 상품이 여러 줄로 올 수 있으니 합친다.
  const quantities = new Map<string, number>();
  for (const line of lines) {
    const quantity = Math.floor(line.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { ok: false, message: "수량이 올바르지 않습니다." };
    }
    quantities.set(
      line.productId,
      (quantities.get(line.productId) ?? 0) + quantity,
    );
  }

  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return {
        ok: false,
        message: `한 상품은 최대 ${MAX_QUANTITY_PER_ITEM}개까지 주문할 수 있습니다.`,
      };
    }
  }

  const admin = createAdminClient();
  const { data: productRows, error: productError } = await admin
    .from("products")
    .select("id, name, price, stock, is_active")
    .in("id", [...quantities.keys()]);

  if (productError) {
    return { ok: false, message: "상품 정보를 불러오지 못했습니다." };
  }

  const products = (productRows ?? []) as Pick<
    Product,
    "id" | "name" | "price" | "stock" | "is_active"
  >[];

  if (products.length !== quantities.size) {
    return { ok: false, message: "판매하지 않는 상품이 포함돼 있습니다." };
  }

  let subtotal = 0;
  const items = [];

  for (const product of products) {
    const quantity = quantities.get(product.id)!;

    if (!product.is_active) {
      return { ok: false, message: `${product.name}은(는) 판매가 중단됐습니다.` };
    }
    if (product.stock < quantity) {
      return {
        ok: false,
        message: `${product.name}의 재고가 ${product.stock}개 남았습니다.`,
      };
    }

    subtotal += product.price * quantity;
    items.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
  }

  const amount = subtotal + shippingFeeFor(subtotal);

  const first = products[0];
  const orderName =
    products.length > 1
      ? `${first.name} 외 ${products.length - 1}건`
      : first.name;

  // 로그인했으면 주문을 계정에 연결하고, 아니면 비회원 주문으로 남긴다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orderNo = generateOrderNo();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_no: orderNo,
      user_id: user?.id ?? null,
      customer_name: name,
      customer_email: email,
      order_name: orderName,
      amount,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, message: "주문을 생성하지 못했습니다." };
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { ok: false, message: "주문 상품을 저장하지 못했습니다." };
  }

  return { ok: true, orderNo };
}

/**
 * 결제 취소(환불). 토스에 취소를 요청하고, 성공하면 주문을 canceled로 바꾸고 재고를 되돌린다.
 */
export async function cancelOrder(
  orderNo: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();

  const order = data as Order | null;
  if (!order) return { ok: false, message: "주문을 찾을 수 없습니다." };

  // 회원 주문이면 본인만 취소할 수 있다. 비회원 주문은 주문번호를 아는 사람만 접근할 수 있다.
  if (order.user_id) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== order.user_id) {
      return { ok: false, message: "이 주문을 취소할 권한이 없습니다." };
    }
  }

  if (order.status !== "paid" || !order.payment_key) {
    return { ok: false, message: "결제 완료된 주문만 취소할 수 있습니다." };
  }

  const result = await cancelPayment({
    paymentKey: order.payment_key,
    cancelReason: reason.trim() || "구매자 요청",
    idempotencyKey: randomUUID(),
  });

  if (!result.ok) {
    return {
      ok: false,
      message: toKoreanMessage(result.error.code, result.error.message),
    };
  }

  const { error } = await admin.rpc("mark_order_canceled", {
    p_order_no: orderNo,
    p_reason: reason.trim() || "구매자 요청",
  });

  if (error) {
    return {
      ok: false,
      message: "토스 취소는 됐지만 주문 상태 반영에 실패했습니다. 관리자에게 문의해 주세요.",
    };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderNo}`);
  return { ok: true };
}
