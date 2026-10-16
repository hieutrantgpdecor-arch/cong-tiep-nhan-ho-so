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

// Xóa cuộc trò chuyện; các tin nhắn bên trong bị xóa theo (on delete cascade).
export async function deleteConversation(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("conversations").delete().eq("id", id);
  if (error) throw error;
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  firstQuestion: string | null;
}

// Dành cho trang quản trị: các cuộc trò chuyện gần nhất kèm số tin và câu hỏi đầu tiên.
export async function listConversations(limit = 100): Promise<ConversationSummary[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("conversations")
    .select("id, created_at, updated_at, messages(count)")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!data?.length) return [];

  const ids = data.map((c) => c.id as string);
  const { data: firsts, error: firstsError } = await db
    .from("messages")
    .select("conversation_id, content")
    .in("conversation_id", ids)
    .eq("role", "user")
    .order("id", { ascending: true });
  if (firstsError) throw firstsError;

  const firstByConversation = new Map<string, string>();
  for (const m of firsts ?? []) {
    if (!firstByConversation.has(m.conversation_id)) {
      firstByConversation.set(m.conversation_id, m.content);
    }
  }

  return data.map((c) => ({
    id: c.id as string,
    createdAt: c.created_at as string,
    updatedAt: c.updated_at as string,
    messageCount: (c.messages as { count: number }[])[0]?.count ?? 0,
    firstQuestion: firstByConversation.get(c.id as string) ?? null,
  }));
}

export interface ConversationDetail {
  id: string;
  createdAt: string;
  messages: { id: number; role: ChatRole; content: string; createdAt: string }[];
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  if (!isValidConversationId(id)) return null;
  const db = getSupabaseAdmin();

  const { data: conversation, error } = await db
    .from("conversations")
    .select("id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!conversation) return null;

  const { data: messages, error: messagesError } = await db
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("id", { ascending: true });
  if (messagesError) throw messagesError;

  return {
    id: conversation.id as string,
    createdAt: conversation.created_at as string,
    messages: (messages ?? []).map((m) => ({
      id: m.id as number,
      role: m.role as ChatRole,
      content: m.content as string,
      createdAt: m.created_at as string,
    })),
  };
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
