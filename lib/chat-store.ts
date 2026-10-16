import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type ChatRole = "user" | "model";

export interface StoredMessage {
  role: ChatRole;
  content: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidConversationId(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

export async function createConversation(): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .from("conversations")
    .insert({})
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function conversationExists(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addMessage(conversationId: string, role: ChatRole, content: string) {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("messages")
    .insert({ conversation_id: conversationId, role, content });
  if (error) throw error;
  await db
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

// Trả về `limit` tin gần nhất, theo thứ tự cũ → mới.
export async function getRecentMessages(
  conversationId: string,
  limit = 50,
): Promise<StoredMessage[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).reverse() as StoredMessage[];
}
