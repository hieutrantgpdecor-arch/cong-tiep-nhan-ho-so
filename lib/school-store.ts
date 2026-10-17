import { getSupabasePublic } from "@/lib/supabase-public";
import type { School } from "@/lib/mock-data";

// Danh sách trường tham chiếu là dữ liệu công khai nên đọc bằng publishable key.
export async function listSchools(): Promise<School[]> {
  const { data, error } = await getSupabasePublic()
    .from("schools")
    .select("id, name, country, min_gpa, min_ielts")
    .order("country", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    country: s.country as string,
    minGpa: Number(s.min_gpa),
    minIelts: Number(s.min_ielts),
  }));
}
