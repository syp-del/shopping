import "server-only";
import { createClient } from "@supabase/supabase-js";

// RLS를 우회하는 관리자 클라이언트. 주문 생성/결제 확정처럼 클라이언트가 조작하면 안 되는
// 쓰기 작업에만 사용한다. import "server-only" 덕분에 클라이언트 번들에 섞이면 빌드가 실패한다.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
