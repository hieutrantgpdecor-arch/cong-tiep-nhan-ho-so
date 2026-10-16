import { Card } from "@/components/ui/card";
import { ExtractLeadButton } from "@/components/admin/extract-lead-button";
import { LeadQualityBadge } from "@/components/status-badge";
import type { StoredLead } from "@/lib/lead-store";
import { formatDateTime } from "@/lib/format";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export function LeadCard({
  conversationId,
  lead,
  currentMessageCount,
}: {
  conversationId: string;
  lead: StoredLead | null;
  currentMessageCount: number;
}) {
  const outdated = lead && currentMessageCount > lead.messageCount;

  return (
    <Card className="space-y-4 p-6 lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Thông tin lead</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Trích xuất bằng Gemini từ cuộc trò chuyện</p>
        </div>
        {lead && <LeadQualityBadge quality={lead.quality} />}
      </div>

      {!lead ? (
        <p className="text-sm text-muted-foreground">
          Chưa trích xuất thông tin lead cho cuộc trò chuyện này.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Tên">{lead.name}</Field>
            <Field label="Email">{lead.email && <span className="break-all">{lead.email}</span>}</Field>
            <Field label="Số điện thoại">{lead.phone}</Field>
            <Field label="Nước du học">{lead.studyCountry}</Field>
            <Field label="Bậc học">{lead.degreeLevel}</Field>
            <Field label="Ngành">{lead.major}</Field>
            <Field label="Availability">{lead.availability}</Field>
            <Field label="Đặt lịch tư vấn">
              {lead.wantsConsultation === null ? null : lead.wantsConsultation ? "Có" : "Không"}
            </Field>
          </dl>
          <div>
            <p className="text-xs text-muted-foreground">Ghi chú</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">
              {lead.note ?? <span className="text-muted-foreground">—</span>}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Trích xuất lúc {formatDateTime(lead.extractedAt)} từ {lead.messageCount} tin nhắn ({lead.model})
          </p>
          {outdated && (
            <p className="rounded-lg bg-yellow-100 px-3 py-2 text-xs text-yellow-700">
              Cuộc trò chuyện đã có tin nhắn mới sau lần trích xuất, nên trích xuất lại.
            </p>
          )}
        </>
      )}

      <ExtractLeadButton id={conversationId} hasLead={!!lead} />
    </Card>
  );
}
