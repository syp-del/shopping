export const CATEGORIES = [
  "가구",
  "조명",
  "패브릭",
  "주방",
  "수납",
  "향",
  "캠핑",
];

export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 3000;

/** 장바구니 화면과 서버의 주문 금액 계산이 갈라지지 않도록 배송비 규칙은 여기 한 곳에만 둔다. */
export function shippingFeeFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1777041097323-2f2ab6734a82?w=1920&q=80&auto=format&fit=crop";

export const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1771209848710-75748c2580f0?w=1600&q=80&auto=format&fit=crop";
