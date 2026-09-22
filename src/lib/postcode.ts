"use client";

/**
 * 다음(카카오) 우편번호 서비스. https://postcode.map.daum.net/guide
 *
 * open()은 새 창을 띄우기 때문에 팝업 차단에 막힌다. 페이지 안의 레이어에
 * embed()로 붙여서 어디서든 뜨도록 한다. 스크립트는 처음 열 때만 내려받는다.
 */
const SCRIPT_SRC =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export type PostcodeResult = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
};

type PostcodeInstance = { embed: (element: HTMLElement) => void };

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void;
        onclose?: (state: string) => void;
        width?: string;
        height?: string;
      }) => PostcodeInstance;
    };
  }
}

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.daum?.Postcode) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("postcode script failed")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("postcode script failed"));
    document.head.appendChild(script);
  });
}

export async function embedPostcode(
  element: HTMLElement,
  handlers: {
    onComplete: (result: PostcodeResult) => void;
    onClose?: () => void;
  },
) {
  await loadScript();
  if (!window.daum?.Postcode) throw new Error("postcode unavailable");

  new window.daum.Postcode({
    oncomplete: handlers.onComplete,
    onclose: () => handlers.onClose?.(),
    width: "100%",
    height: "100%",
  }).embed(element);
}
