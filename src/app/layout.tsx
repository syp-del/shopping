import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

const serifKr = Noto_Serif_KR({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-serif-kr",
  display: "swap",
});

const sansKr = Noto_Sans_KR({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PLAIN — 홈 인테리어 · 라이프스타일",
  description: "오래 두고 쓰는 것들. 집을 조용히 채우는 살림과 소재를 고릅니다.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="ko"
      className={`${serifKr.variable} ${sansKr.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-paper text-bark flex min-h-full flex-col">
        <Header userEmail={user?.email ?? null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
