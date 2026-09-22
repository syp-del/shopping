import { createClient } from "@/lib/supabase/server";
import { CartView } from "./CartView";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <CartView defaultEmail={user?.email ?? ""} />;
}
