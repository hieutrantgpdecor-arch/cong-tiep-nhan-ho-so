import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { RequestStatus, ServicePackage } from "@/lib/mock-data";

export interface QuoteRequestRow {
  id: string;
  fullName: string;
  email: string;
  country: string;
  package: ServicePackage;
  quoteVnd: number;
  status: RequestStatus;
  createdAt: string;
}

const COLUMNS = "id, full_name, email, country, package, quote_vnd, status, created_at";

function toRow(r: Record<string, unknown>): QuoteRequestRow {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    email: r.email as string,
    country: r.country as string,
    package: r.package as ServicePackage,
    quoteVnd: r.quote_vnd as number,
    status: r.status as RequestStatus,
    createdAt: r.created_at as string,
  };
}

export function isValidRequestId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function listRequests(): Promise<QuoteRequestRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("requests")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRow);
}

// Chuyển yêu cầu từ chờ duyệt sang đã duyệt trong một câu lệnh duy nhất, nên bấm đúp hay hai
// admin cùng bấm thì chỉ một bên "giành" được. Trả về null nếu yêu cầu không còn ở trạng thái chờ duyệt.
export async function claimRequestForApproval(id: string): Promise<QuoteRequestRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("requests")
    .update({ status: "da_duyet" })
    .eq("id", id)
    .eq("status", "cho_duyet")
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toRow(data) : null;
}

// Từ chối = xóa hẳn yêu cầu. Chỉ xóa khi còn chờ duyệt, nên một yêu cầu vừa được admin khác
// duyệt sẽ không bị xóa nhầm. Trả về false nếu không có gì bị xóa.
export async function deletePendingRequest(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("requests")
    .delete()
    .eq("id", id)
    .eq("status", "cho_duyet")
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Hoàn tác khi gửi webhook thất bại, để admin bấm Duyệt lại được.
export async function revertApproval(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("requests")
    .update({ status: "cho_duyet" })
    .eq("id", id)
    .eq("status", "da_duyet");
  if (error) throw error;
}
