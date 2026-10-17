import "server-only";
import { cookies } from "next/headers";
import { isValidConversationId as isUuid } from "@/lib/chat-store";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { DOC_TYPES, type DocDataMap, type DocType, type StudentDocument } from "@/lib/documents";
import { DOC_MODEL } from "@/lib/document-extractor";

const COOKIE_NAME = "student_pid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

// Chưa có đăng nhập (Tuần 6): hồ sơ được gắn với trình duyệt qua cookie httpOnly chứa mã
// ngẫu nhiên (uuid). Toàn bộ dữ liệu nằm trong Supabase và chỉ server đọc/ghi được.
export async function getProfileIdFromCookie(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return isUuid(value) ? value : null;
}

// Chỉ gọi trong route handler / server action (cần ghi cookie).
export async function ensureProfile(): Promise<string> {
  const db = getSupabaseAdmin();
  const existing = await getProfileIdFromCookie();
  if (existing) {
    const { data, error } = await db
      .from("student_profiles")
      .select("id")
      .eq("id", existing)
      .maybeSingle();
    if (error) throw error;
    if (data) return existing;
  }

  const { data, error } = await db.from("student_profiles").insert({}).select("id").single();
  if (error) throw error;
  const id = data.id as string;

  (await cookies()).set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return id;
}

export async function saveDocument<T extends DocType>(
  profileId: string,
  type: T,
  doc: {
    fileName: string;
    status: "hop_le" | "can_nop_lai";
    reason: string | null;
    data: DocDataMap[T] | null;
  },
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("student_documents").upsert({
    profile_id: profileId,
    doc_type: type,
    file_name: doc.fileName,
    status: doc.status,
    failure_reason: doc.reason,
    extracted: doc.data,
    model: DOC_MODEL,
    uploaded_at: new Date().toISOString(),
  });
  if (error) throw error;
  await db
    .from("student_profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", profileId);
}

export type StudentDocuments = { [K in DocType]: StudentDocument<K> | null };

export async function getStudentDocuments(profileId: string): Promise<StudentDocuments> {
  const { data, error } = await getSupabaseAdmin()
    .from("student_documents")
    .select("doc_type, file_name, status, failure_reason, extracted, uploaded_at")
    .eq("profile_id", profileId);
  if (error) throw error;

  const result: StudentDocuments = { transcript: null, ielts: null, identity: null };
  for (const row of data ?? []) {
    const type = row.doc_type as DocType;
    if (!DOC_TYPES.includes(type)) continue;
    (result as Record<DocType, StudentDocument | null>)[type] = {
      type,
      fileName: row.file_name,
      status: row.status,
      reason: row.failure_reason,
      data: row.extracted,
      uploadedAt: row.uploaded_at,
    } as StudentDocument;
  }
  return result;
}
