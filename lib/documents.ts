// Kiểu dữ liệu và hằng số dùng chung cho giấy tờ học viên (an toàn để import cả ở client).

export const DOC_TYPES = ["transcript", "ielts", "identity"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const DOC_LABELS: Record<DocType, string> = {
  transcript: "Bảng điểm (PDF)",
  ielts: "Ảnh chứng chỉ IELTS",
  identity: "Ảnh CMND/CCCD hoặc hộ chiếu",
};

export const DOC_ACCEPT: Record<DocType, { mime: string[]; hint: string }> = {
  transcript: { mime: ["application/pdf"], hint: "Chấp nhận PDF" },
  ielts: { mime: ["image/jpeg", "image/png"], hint: "Chấp nhận JPG, PNG" },
  identity: { mime: ["image/jpeg", "image/png"], hint: "Chấp nhận JPG, PNG" },
};

// Ngày luôn lưu dạng YYYY-MM-DD.
export interface TranscriptData {
  fullName: string | null;
  dateOfBirth: string | null;
  gpa: number | null;
  // Thang điểm tối đa của điểm tổng kết (4, 10, 100...), null nếu bảng điểm không ghi.
  gpaScale: number | null;
}

export interface IeltsData {
  fullName: string | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  overall: number | null;
  testDate: string | null;
}

export interface IdentityData {
  fullName: string | null;
  dateOfBirth: string | null;
  idNumber: string | null;
}

export interface DocDataMap {
  transcript: TranscriptData;
  ielts: IeltsData;
  identity: IdentityData;
}

export type DocStatusValue = "chua_nop" | "dang_xu_ly" | "hop_le" | "can_nop_lai";

export interface StudentDocument<T extends DocType = DocType> {
  type: T;
  fileName: string;
  status: "hop_le" | "can_nop_lai";
  reason: string | null;
  data: DocDataMap[T] | null;
  uploadedAt: string;
}

export function formatIsoDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
