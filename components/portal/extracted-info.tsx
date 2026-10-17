import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOC_LABELS, formatIsoDate, type DocType } from "@/lib/documents";
import type { StudentDocuments } from "@/lib/student-store";

type Field = { label: string; value: string | null };

function Section({ type, fields, hasData }: { type: DocType; fields: Field[]; hasData: boolean }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">{DOC_LABELS[type]}</h3>
      {!hasData ? (
        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          Chưa có thông tin, hãy nộp giấy tờ này ở phía trên.
        </p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="rounded-lg bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 break-words text-base font-medium">
                {field.value ?? <span className="text-muted-foreground">Không đọc được</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

const score = (n: number | null) => (n === null ? null : n.toFixed(1));

export function ExtractedInfo({ documents }: { documents: StudentDocuments }) {
  const t = documents.transcript?.data ?? null;
  const i = documents.ielts?.data ?? null;
  const d = documents.identity?.data ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin đã trích xuất</CardTitle>
        <p className="text-sm text-muted-foreground">
          Đây là thông tin hệ thống đọc được từ giấy tờ bạn đã nộp, kiểm tra lại xem có đúng không nhé.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <Section
          type="transcript"
          hasData={!!t}
          fields={[
            { label: "Họ tên", value: t?.fullName ?? null },
            { label: "Ngày sinh", value: formatIsoDate(t?.dateOfBirth ?? null) },
            { label: "Điểm học tập tổng kết", value: t?.gpa != null ? `${t.gpa}${t.gpaScale ? ` / ${t.gpaScale}` : ""}` : null },
          ]}
        />
        <Section
          type="ielts"
          hasData={!!i}
          fields={[
            { label: "Họ tên trên chứng chỉ", value: i?.fullName ?? null },
            { label: "Nghe (Listening)", value: score(i?.listening ?? null) },
            { label: "Đọc (Reading)", value: score(i?.reading ?? null) },
            { label: "Viết (Writing)", value: score(i?.writing ?? null) },
            { label: "Nói (Speaking)", value: score(i?.speaking ?? null) },
            { label: "Điểm tổng (Overall)", value: score(i?.overall ?? null) },
            { label: "Ngày thi", value: formatIsoDate(i?.testDate ?? null) },
          ]}
        />
        <Section
          type="identity"
          hasData={!!d}
          fields={[
            { label: "Họ tên", value: d?.fullName ?? null },
            { label: "Ngày sinh", value: formatIsoDate(d?.dateOfBirth ?? null) },
            { label: "Số giấy tờ", value: d?.idNumber ?? null },
          ]}
        />
      </CardContent>
    </Card>
  );
}
