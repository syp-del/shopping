"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.min(product.stock, 10);

  if (product.stock === 0) {
    return (
      <p className="border-sand text-clay mt-12 border py-4 text-center text-[13px]">
        품절된 상품입니다
      </p>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-6">
        <span className="text-clay text-[13px]">수량</span>
        <div className="border-sand flex items-center border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="text-clay hover:text-bark px-4 py-2 transition-colors duration-500"
            aria-label="수량 줄이기"
          >
            −
          </button>
          <span className="w-10 text-center text-[13px]">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            className="text-clay hover:text-bark px-4 py-2 transition-colors duration-500"
            aria-label="수량 늘리기"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => {
            addToCart(
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.image_url,
              },
              quantity,
            );
            setAdded(true);
          }}
          className="btn btn-solid flex-1"
        >
          장바구니 담기
        </button>
        <Link href="/cart" className="btn btn-line">
          장바구니
        </Link>
      </div>

      {added && (
        <p className="text-clay mt-5 text-center text-[12px]">
          장바구니에 담았습니다.
        </p>
      )}
    </div>
  );
}
