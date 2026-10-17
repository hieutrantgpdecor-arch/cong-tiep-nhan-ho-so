import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client dùng publishable key (quyền anon) để đọc dữ liệu CÔNG KHAI, ví dụ bảng schools.
// Quyền thực sự do RLS ở database quyết định: bảng riêng tư không có policy nên không đọc được.
let client: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_PUBLISHABLE_KEY trong .env");
  }

  client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
