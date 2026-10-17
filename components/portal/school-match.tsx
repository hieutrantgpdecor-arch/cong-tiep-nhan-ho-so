import { Check, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MatchVerdict, SchoolMatchResult } from "@/lib/school-match";

const verdictMeta: Record<
  MatchVerdict,
  { label: string; card: string; icon: string; Icon: typeof Check; text: string }
> = {
  dat: {
    label: "Đạt điểm chuẩn",
    card: "border-green-200 bg-green-50",
    icon: "bg-green-500 text-white",
    Icon: Check,
    text: "text-green-700",
  },
  chua_dat: {
    label: "Chưa đạt",
    card: "border-border bg-muted/30",
    icon: "bg-gray-200 text-gray-500",
    Icon: X,
    text: "text-gray-600",
  },
  thieu: {
    label: "Chưa đủ dữ liệu",
    card: "border-yellow-200 bg-yellow-50",
    icon: "bg-yellow-200 text-yellow-700",
    Icon: Minus,
    text: "text-yellow-700",
  },
};

function Criterion({
  label,
  ok,
  mine,
  required,
}: {
  label: string;
  ok: boolean | null;
  mine: string | null;
  required: string;
}) {
  return (
    <p>
      {label}: bạn{" "}
      <span
        className={cn(
          "font-medium",
          ok === true && "text-green-700",
          ok === false && "text-red-600",
          ok === null && "text-muted-foreground",
        )}
      >
        {mine ?? "chưa có"}
      </span>{" "}
      / yêu cầu ≥ {required}
    </p>
  );
}

export function SchoolMatch({
  results,
  gpa10,
  ielts,
  gpaUnclear,
  notice,
}: {
  results: SchoolMatchResult[];
  gpa10: number | null;
  ielts: number | null;
  // Có điểm học tập nhưng chưa rõ thang điểm nên không quy được về thang 10 (ví dụ "3.2").
  gpaUnclear?: string | null;
  // Có thông báo thì chưa đối chiếu (hồ sơ chưa đầy đủ/hợp lệ) và hiện thông báo thay cho kết quả.
  notice?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đối chiếu điểm chuẩn</CardTitle>
        <p className="text-sm text-muted-foreground">
          So sánh điểm học tập (quy về thang 10) và điểm IELTS tổng của bạn với điểm chuẩn từng trường.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && (
          <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            {notice}
          </p>
        )}
        {!notice && results.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có trường tham chiếu nào.</p>
        )}
        {results.map(({ school, gpaOk, ieltsOk, verdict }) => {
          const meta = verdictMeta[verdict];
          return (
            <div
              key={school.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4",
                meta.card,
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    meta.icon,
                  )}
                >
                  <meta.Icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {school.country} ·{" "}
                    <span className={cn("font-medium", meta.text)}>{meta.label}</span>
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground sm:text-right">
                <Criterion
                  label="GPA"
                  ok={gpaOk}
                  mine={
                    gpa10 !== null
                      ? gpa10.toFixed(1)
                      : gpaUnclear
                        ? `${gpaUnclear} (chưa rõ thang điểm)`
                        : null
                  }
                  required={school.minGpa.toFixed(1)}
                />
                <Criterion
                  label="IELTS"
                  ok={ieltsOk}
                  mine={ielts === null ? null : ielts.toFixed(1)}
                  required={school.minIelts.toFixed(1)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
