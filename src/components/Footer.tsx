import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-sand mt-28 border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="text-[15px] tracking-[0.42em]">PLAIN</p>
            <p className="text-clay mt-6 text-[13px] leading-loose">
              오래 두고 쓰는 것들을 만듭니다. 유행을 타지 않는 소재와 형태,
              매일의 살림에 조용히 스며드는 물건들.
            </p>
          </div>

          <div>
            <p className="text-clay mb-4 text-[10px] tracking-[0.3em]">SHOP</p>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    href={`/?category=${encodeURIComponent(category)}#shop`}
                    className="text-clay hover:text-ochre transition-colors"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-clay/70 border-sand mt-14 border-t pt-6 text-xs leading-relaxed">
          수업 실습용 데모 사이트입니다. 토스페이먼츠 테스트 키로 동작하며 실제
          결제는 일어나지 않습니다.
        </p>
      </div>
    </footer>
  );
}
