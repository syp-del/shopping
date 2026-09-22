import { sizedImage } from "@/lib/types";

/**
 * 상세 영역의 추가 사진. 대표컷은 화면 위쪽에서 따로 보여주므로 여기서는 제외한다.
 * 추가 컷이 없는 상품은 아무것도 렌더하지 않는다.
 */
export function DetailPhotos({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      {images.map((src, index) => (
        <div key={src} className="bg-linen aspect-4/3 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sizedImage(src, 1600)}
            alt={`${alt} ${index + 1}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
