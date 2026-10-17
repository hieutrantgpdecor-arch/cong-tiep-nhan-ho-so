import type { IeltsData, TranscriptData } from "@/lib/documents";
import type { School } from "@/lib/mock-data";

// Điểm chuẩn của trường tính trên thang 10; điểm học tập của học viên được quy về thang 10 trước khi so.
export interface StudentScores {
  gpa: number | null;
  gpaScale: number | null;
  ielts: number | null;
}

export type MatchVerdict = "dat" | "chua_dat" | "thieu";

export interface SchoolMatchResult {
  school: School;
  gpaOk: boolean | null;
  ieltsOk: boolean | null;
  verdict: MatchVerdict;
}

export function gpaOnTenScale(gpa: number | null, scale: number | null): number | null {
  if (gpa === null) return null;
  let value: number;
  if (scale && scale > 0) {
    value = (gpa / scale) * 10;
  } else if (gpa > 10) {
    value = gpa / 10; // không ghi thang điểm nhưng lớn hơn 10: coi là thang 100
  } else if (gpa <= 4.5) {
    return null; // có thể là thang 4 hoặc thang 10, không đủ căn cứ để so
  } else {
    value = gpa;
  }
  return Math.round(value * 100) / 100;
}

export function matchSchools(schools: School[], scores: StudentScores): SchoolMatchResult[] {
  const gpa10 = gpaOnTenScale(scores.gpa, scores.gpaScale);

  return schools.map((school) => {
    const gpaOk = gpa10 === null ? null : gpa10 >= school.minGpa;
    const ieltsOk = scores.ielts === null ? null : scores.ielts >= school.minIelts;

    let verdict: MatchVerdict;
    if (gpaOk === false || ieltsOk === false) verdict = "chua_dat";
    else if (gpaOk === null || ieltsOk === null) verdict = "thieu";
    else verdict = "dat";

    return { school, gpaOk, ieltsOk, verdict };
  });
}

export function studentScores(
  transcript: TranscriptData | null,
  ielts: IeltsData | null,
): StudentScores {
  return {
    gpa: transcript?.gpa ?? null,
    gpaScale: transcript?.gpaScale ?? null,
    ielts: ielts?.overall ?? null,
  };
}

// Hồ sơ đầy đủ và hợp lệ: cả 3 giấy tờ đã nộp và được hệ thống đọc được (trạng thái hop_le).
// Chỉ khi đó mới đối chiếu điểm chuẩn.
export function isProfileComplete(docs: {
  transcript: { status: string } | null;
  ielts: { status: string } | null;
  identity: { status: string } | null;
}): boolean {
  return [docs.transcript, docs.ielts, docs.identity].every((d) => d?.status === "hop_le");
}
