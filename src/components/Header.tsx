"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/lib/cart";
import { signOut } from "@/app/auth/actions";
import { CATEGORIES } from "@/lib/constants";

export function Header({ userEmail }: { userEmail: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const { items, loaded } = useCart();
  const count = cartCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${
        scrolled
          ? "border-sand bg-paper/95 border-b backdrop-blur-sm"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-10 px-6 sm:px-10">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-[15px] tracking-[0.42em]">PLAIN</span>
          <span className="text-clay mt-1.5 text-[9px] tracking-[0.28em]">
            HOME &amp; LIVING
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/?category=${encodeURIComponent(category)}#shop`}
              className="text-clay hover:text-bark text-[13px] transition-colors duration-500"
            >
              {category}
            </Link>
          ))}
        </nav>

        <div className="text-clay ml-auto flex items-center gap-6 text-[13px]">
          {userEmail ? (
            <>
              <Link
                href="/orders"
                className="hover:text-bark hidden transition-colors duration-500 sm:block"
              >
                주문내역
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="hover:text-bark transition-colors duration-500"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="hover:text-bark transition-colors duration-500"
            >
              로그인
            </Link>
          )}

          <Link
            href="/cart"
            className="hover:text-bark transition-colors duration-500"
          >
            장바구니
            <span
              className={`ml-1.5 transition-opacity duration-500 ${
                loaded && count > 0 ? "text-bark opacity-100" : "opacity-0"
              }`}
            >
              ({count})
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
