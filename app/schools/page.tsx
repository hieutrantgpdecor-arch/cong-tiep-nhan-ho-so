import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isProfileComplete, matchSchools, studentScores, type MatchVerdict } from "@/lib/school-match";
import { listSchools } from "@/lib/school-store";
import { getProfileIdFromCookie, getStudentDocuments } from "@/lib/student-store";

export const metadata: Metadata = {
  title: "Điểm chuẩn trường — DuHoc24",
  description: "Điểm học tập và IELTS tối thiểu của các trường tham chiếu.",
};

// Danh sách trường là dữ liệu công khai; cột "Kết quả của bạn" chỉ hiện khi trình duyệt đã có hồ sơ.
export const dynamic = "force-dynamic";

const verdictBadge: Record<MatchVerdict, { label: string; tone: "green" | "gray" | "yellow" }> = {
  dat: { label: "Đạt", tone: "green" },
  chua_dat: { label: "Chưa đạt", tone: "gray" },
  thieu: { label: "Chưa đủ dữ liệu", tone: "yellow" },
};

export default async function SchoolsPage() {
  const schools = await listSchools();

  const profileId = await getProfileIdFromCookie();
  const documents = profileId ? await getStudentDocuments(profileId) : null;
  const scores = documents
    ? studentScores(documents.transcript?.data ?? null, documents.ielts?.data ?? null)
    : null;
  // Chỉ đối chiếu khi hồ sơ đầy đủ và hợp lệ; so sánh bằng phép tính số thuần, không dùng AI.
  const hasScores = !!documents && !!scores && isProfileComplete(documents);
  const verdictBySchool = new Map(
    (hasScores && scores ? matchSchools(schools, scores) : []).map((r) => [r.school.id, r.verdict]),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-32">
        <h1 className="text-balance text-3xl font-medium tracking-tight md:text-4xl">
          Điểm chuẩn trường
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Điểm học tập (thang 10) và điểm IELTS tối thiểu của từng trường. Hệ thống dùng các mức này để
          đối chiếu hồ sơ của bạn trong{" "}
          <Link href="/portal" className="text-foreground underline underline-offset-4">
            Cổng hồ sơ
          </Link>
          .
        </p>

        <Card className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên trường</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Điểm học tập tối thiểu</TableHead>
                <TableHead>IELTS tối thiểu</TableHead>
                {hasScores && <TableHead>Kết quả của bạn</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Chưa có trường tham chiếu nào.
                  </TableCell>
                </TableRow>
              )}
              {schools.map((school) => {
                const verdict = verdictBySchool.get(school.id);
                return (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.country}</TableCell>
                    <TableCell>{school.minGpa.toFixed(1)}</TableCell>
                    <TableCell>{school.minIelts.toFixed(1)}</TableCell>
                    {hasScores && (
                      <TableCell>
                        {verdict && (
                          <StatusBadge
                            tone={verdictBadge[verdict].tone}
                            label={verdictBadge[verdict].label}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {!hasScores && (
          <p className="mt-4 text-sm text-muted-foreground">
            Nộp đủ và hợp lệ 3 loại giấy tờ trong Cổng hồ sơ để hệ thống tự cho biết bạn đạt điểm chuẩn trường nào.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
