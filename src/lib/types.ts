export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string | null;
  gallery: string[];
  story: string | null;
  material: string | null;
  dimensions: string | null;
  care: string | null;
  origin: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
};

export type ProductSection = {
  id: string;
  product_id: string;
  sort_order: number;
  image_url: string | null;
  heading: string;
  body: string;
};

export type OrderStatus = "pending" | "paid" | "failed" | "canceled";

export type Order = {
  id: string;
  order_no: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  order_name: string;
  amount: number;
  status: OrderStatus;
  payment_key: string | null;
  idempotency_key: string;
  created_at: string;
  paid_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
};

export const formatKRW = (value: number) => `${value.toLocaleString("ko-KR")}원`;

/**
 * Unsplash CDN은 URL의 w 파라미터로 리사이즈·포맷 변환을 해준다.
 * 슬롯마다 필요한 크기만 요청해 전송량을 줄인다. (next/image를 쓰지 않는 이유)
 */
export const sizedImage = (url: string, width: number) =>
  url.replace(/([?&])w=\d+/, `$1w=${width}`);
