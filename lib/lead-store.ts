import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { LEAD_MODEL, type ExtractedLead, type LeadQuality } from "@/lib/lead-extractor";

export interface StoredLead extends ExtractedLead {
  model: string;
  messageCount: number;
  extractedAt: string;
}

// Mỗi cuộc trò chuyện có tối đa một lead; trích xuất lại sẽ ghi đè bản cũ.
export async function saveLead(
  conversationId: string,
  lead: ExtractedLead,
  messageCount: number,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("leads")
    .upsert({
      conversation_id: conversationId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      study_country: lead.studyCountry,
      degree_level: lead.degreeLevel,
      major: lead.major,
      availability: lead.availability,
      wants_consultation: lead.wantsConsultation,
      note: lead.note,
      quality: lead.quality,
      model: LEAD_MODEL,
      message_count: messageCount,
      extracted_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function getLead(conversationId: string): Promise<StoredLead | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("leads")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    studyCountry: data.study_country,
    degreeLevel: data.degree_level,
    major: data.major,
    availability: data.availability,
    wantsConsultation: data.wants_consultation,
    note: data.note,
    quality: data.quality as LeadQuality,
    model: data.model,
    messageCount: data.message_count,
    extractedAt: data.extracted_at,
  };
}

export async function getLeadQualities(
  conversationIds: string[],
): Promise<Map<string, LeadQuality>> {
  const result = new Map<string, LeadQuality>();
  if (!conversationIds.length) return result;

  const { data, error } = await getSupabaseAdmin()
    .from("leads")
    .select("conversation_id, quality")
    .in("conversation_id", conversationIds);
  if (error) throw error;
  for (const row of data ?? []) {
    result.set(row.conversation_id as string, row.quality as LeadQuality);
  }
  return result;
}
