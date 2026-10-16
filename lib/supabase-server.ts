import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client dùng secret key (bỏ qua RLS), CHỈ chạy ở phía server.
// Không bao giờ import file này từ component "use client".
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env");
  }

  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
