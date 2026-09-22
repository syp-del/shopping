import "server-only";

// 토스페이먼츠 서버 API 레이어.
// 시크릿 키를 쓰기 때문에 반드시 서버에서만 실행돼야 한다. (import "server-only")
const TOSS_API = "https://api.tosspayments.com/v1";

function authorizationHeader() {
  // 시크릿 키 뒤에 콜론(:)을 붙인 뒤 base64로 인코딩한다.
  // 콜론을 빼먹는 것이 토스 연동에서 가장 흔한 실수다.
  const encoded = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString(
    "base64",
  );
  return `Basic ${encoded}`;
}

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  method: string | null;
  totalAmount: number;
  balanceAmount: number;
  requestedAt: string;
  approvedAt: string | null;
  receipt: { url: string } | null;
  card: {
    issuerCode: string;
    number: string;
    installmentPlanMonths: number;
  } | null;
  easyPay: { provider: string; amount: number } | null;
};

export type TossError = { code: string; message: string };

export type TossResult =
  | { ok: true; payment: TossPayment }
  | { ok: false; error: TossError };

/**
 * 결제 승인. 사용자가 결제창에서 인증을 마치면 successUrl로 리다이렉트되는데,
 * 그 시점에는 아직 돈이 빠져나가지 않았다. 이 API를 호출해야 실제로 결제가 확정된다.
 *
 * amount에는 반드시 DB에 저장해 둔 금액을 넣는다.
 * successUrl 쿼리스트링의 amount는 사용자가 브라우저에서 바꿀 수 있으므로 신뢰하면 안 된다.
 */
export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<TossResult> {
  return request(`${TOSS_API}/payments/confirm`, params.idempotencyKey, {
    paymentKey: params.paymentKey,
    orderId: params.orderId,
    amount: params.amount,
  });
}

/**
 * 결제 취소(환불). cancelAmount를 주면 부분 취소, 생략하면 전액 취소다.
 */
export async function cancelPayment(params: {
  paymentKey: string;
  cancelReason: string;
  idempotencyKey: string;
}): Promise<TossResult> {
  return request(
    `${TOSS_API}/payments/${encodeURIComponent(params.paymentKey)}/cancel`,
    params.idempotencyKey,
    { cancelReason: params.cancelReason },
  );
}

async function request(
  url: string,
  idempotencyKey: string,
  body: Record<string, unknown>,
): Promise<TossResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader(),
        "Content-Type": "application/json",
        // 같은 키로 다시 요청하면 토스가 첫 응답을 그대로 돌려준다.
        // 새로고침이나 중복 클릭으로 두 번 결제되는 것을 막아준다. (UUID v4, 15일 유효)
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: { code: "NETWORK_ERROR", message: "토스 서버에 연결하지 못했습니다." },
    };
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    return {
      ok: false,
      error: (data as TossError) ?? {
        code: "UNKNOWN_ERROR",
        message: "알 수 없는 오류가 발생했습니다.",
      },
    };
  }

  return { ok: true, payment: data as TossPayment };
}

const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: "결제를 취소하셨습니다.",
  PAY_PROCESS_ABORTED: "결제 진행 중 오류가 발생했습니다. 다시 시도해 주세요.",
  REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다. 다른 카드로 시도해 주세요.",
  INVALID_CARD_EXPIRATION: "카드 유효기간을 다시 확인해 주세요.",
  INVALID_STOPPED_CARD: "정지된 카드입니다.",
  EXCEED_MAX_DAILY_PAYMENT_COUNT: "하루 결제 가능 횟수를 초과했습니다.",
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT:
    "이 카드로는 할부를 선택할 수 없습니다.",
  EXCEED_MAX_ONE_DAY_AMOUNT: "하루 결제 한도를 초과했습니다.",
  NOT_FOUND_PAYMENT_SESSION:
    "결제 시간이 만료되었습니다. 결제창을 띄운 뒤 10분 안에 완료해야 합니다.",
  ALREADY_PROCESSED_PAYMENT: "이미 처리된 결제입니다.",
  FORBIDDEN_REQUEST: "허용되지 않은 요청입니다. 주문번호와 결제키를 확인해 주세요.",
  UNAUTHORIZED_KEY: "API 키가 올바르지 않습니다. 클라이언트 키와 시크릿 키의 쌍을 확인해 주세요.",
  INCORRECT_BASIC_AUTH_FORMAT:
    "인증 헤더 형식이 올바르지 않습니다. 시크릿 키 뒤에 콜론(:)을 붙였는지 확인해 주세요.",
  NOT_CANCELABLE_AMOUNT: "취소할 수 없는 금액입니다.",
  ALREADY_CANCELED_PAYMENT: "이미 취소된 결제입니다.",
  AMOUNT_MISMATCH:
    "주문 금액이 일치하지 않아 결제를 중단했습니다. 장바구니에서 다시 주문해 주세요.",
  NETWORK_ERROR: "토스 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export function toKoreanMessage(code: string, fallback: string) {
  return ERROR_MESSAGES[code] ?? fallback;
}
