"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

export default function LoginPage() {
  const [signInError, signInAction, signingIn] = useActionState(signIn, null);
  const [signUpError, signUpAction, signingUp] = useActionState(signUp, null);
  const error = signInError ?? signUpError;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 pt-24 pb-16">
      <p className="label">ACCOUNT</p>
      <h1 className="font-display mt-3 text-[22px]">로그인</h1>
      <p className="text-clay mt-3 text-[13px] leading-relaxed">
        로그인하면 주문내역을 확인할 수 있습니다. 로그인 없이도 주문과 결제는
        가능합니다.
      </p>

      <form className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-clay mb-2 block text-[11px]">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border-sand focus:border-bark w-full rounded-[2px] border bg-linen px-4 py-3 text-[13px] outline-none transition"
            placeholder="hello@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-clay mb-2 block text-[11px]">
            비밀번호 (6자 이상)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="border-sand focus:border-bark w-full rounded-[2px] border bg-linen px-4 py-3 text-[13px] outline-none transition"
            placeholder="••••••"
          />
        </div>

        {error && (
          <p className="rounded-[2px] border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            formAction={signInAction}
            disabled={signingIn || signingUp}
            className="bg-bark flex-1 rounded-[2px] py-3 text-[13px] text-paper transition hover:opacity-85 disabled:opacity-50"
          >
            {signingIn ? "로그인 중…" : "로그인"}
          </button>
          <button
            formAction={signUpAction}
            disabled={signingIn || signingUp}
            className="border-sand hover:border-bark/60 flex-1 rounded-[2px] border py-3 text-[13px] transition disabled:opacity-50"
          >
            {signingUp ? "가입 중…" : "회원가입"}
          </button>
        </div>
      </form>

      <Link
        href="/"
        className="text-clay hover:text-bark mt-8 text-center text-[13px] transition"
      >
        쇼핑 계속하기
      </Link>
    </div>
  );
}
