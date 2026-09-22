export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
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
