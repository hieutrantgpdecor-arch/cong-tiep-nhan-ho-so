import { LogOut } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DocumentFeatures } from "@/components/portal/document-features";
import { ExtractedInfo } from "@/components/portal/extracted-info";
import { SchoolMatch } from "@/components/portal/school-match";
import { DOC_LABELS, DOC_TYPES } from "@/lib/documents";
import { gpaOnTenScale, isProfileComplete, matchSchools, studentScores } from "@/lib/school-match";
import { listSchools } from "@/lib/school-store";
import { getProfileIdFromCookie, getStudentDocuments, type StudentDocuments } from "@/lib/student-store";

// Dữ liệu học viên đọc từ database theo cookie của từng người, không prerender.
export const dynamic = "force-dynamic";

const EMPTY: StudentDocuments = { transcript: null, ielts: null, identity: null };

export default async function PortalPage() {
  const profileId = await getProfileIdFromCookie();
  const documents = profileId ? await getStudentDocuments(profileId) : EMPTY;

  // Khi hồ sơ đầy đủ và hợp lệ, so sánh số điểm của học viên với điểm chuẩn các trường trong database.
  // Phép so sánh là tính toán thuần (lib/school-match.ts), không dùng AI để quyết định đạt hay không.
  const complete = isProfileComplete(documents);
  const schools = complete ? await listSchools() : [];
  const scores = studentScores(documents.transcript?.data ?? null, documents.ielts?.data ?? null);
  const results = matchSchools(schools, scores);
  const notReady = DOC_TYPES.filter((t) => documents[t]?.status !== "hop_le").map((t) => DOC_LABELS[t]);

  const name =
    documents.identity?.data?.fullName ??
    documents.transcript?.data?.fullName ??
    documents.ielts?.data?.fullName ??
    null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-32">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-sm text-muted-foreground">Xin chào,</p>
            <h1 className="text-2xl font-medium tracking-tight">{name ?? "bạn"}</h1>
          </div>
          <Button variant="outline">
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Giấy tờ cần nộp</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nộp đủ 3 loại giấy tờ dưới đây, hệ thống sẽ tự đọc và trích xuất thông tin giúp bạn.
          </p>

          <div className="mt-6">
            <DocumentFeatures
              items={DOC_TYPES.map((type) => {
                const doc = documents[type];
                return {
                  type,
                  fileName: doc?.fileName ?? null,
                  status: doc?.status ?? "chua_nop",
                  reason: doc?.reason ?? null,
                };
              })}
            />
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <ExtractedInfo documents={documents} />
          <SchoolMatch
            results={results}
            gpa10={gpaOnTenScale(scores.gpa, scores.gpaScale)}
            ielts={scores.ielts}
            gpaUnclear={scores.gpa !== null ? String(scores.gpa) : null}
            notice={
              complete
                ? undefined
                : `Hệ thống sẽ tự đối chiếu khi hồ sơ đầy đủ và hợp lệ. Còn thiếu hoặc chưa hợp lệ: ${notReady.join(", ")}.`
            }
          />
        </section>
      </main>
    </>
  );
}
