import { extractDocument } from "@/lib/document-extractor";
import {
  DOC_ACCEPT,
  DOC_LABELS,
  DOC_TYPES,
  MAX_UPLOAD_BYTES,
  type DocDataMap,
  type DocType,
} from "@/lib/documents";
import { ensureProfile, saveDocument } from "@/lib/student-store";

export const maxDuration = 60;

// Xác định định dạng thật từ nội dung tệp, không tin tên hay Content-Type do trình duyệt gửi.
function sniffMime(b: Uint8Array): string | null {
  if (b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return "application/pdf";
  }
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  return null;
}

function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim()
    .slice(0, 200);
  return cleaned || "tai-lieu";
}

const REQUIRED: { [K in DocType]: { key: keyof DocDataMap[K]; label: string }[] } = {
  transcript: [
    { key: "fullName", label: "họ tên" },
    { key: "gpa", label: "điểm tổng kết" },
  ],
  ielts: [
    { key: "fullName", label: "họ tên" },
    { key: "overall", label: "điểm tổng" },
  ],
  identity: [
    { key: "fullName", label: "họ tên" },
    { key: "idNumber", label: "số giấy tờ" },
  ],
};

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Dữ liệu tải lên không hợp lệ.");
  }

  const type = form.get("type");
  const file = form.get("file");
  if (typeof type !== "string" || !(DOC_TYPES as readonly string[]).includes(type)) {
    return bad("Loại giấy tờ không hợp lệ.");
  }
  const docType = type as DocType;
  if (!(file instanceof File) || file.size === 0) return bad("Bạn chưa chọn tệp.");
  if (file.size > MAX_UPLOAD_BYTES) {
    return bad(`Tệp quá lớn, vui lòng chọn tệp nhỏ hơn ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime || !DOC_ACCEPT[docType].mime.includes(mime)) {
    return bad(`Tệp không đúng định dạng cho "${DOC_LABELS[docType]}". ${DOC_ACCEPT[docType].hint}.`);
  }

  let result;
  try {
    result = await extractDocument(docType, mime, bytes);
  } catch (err) {
    console.error("Document extraction failed", docType, err instanceof Error ? err.message : err);
    return bad("Chưa đọc được tệp, bạn thử lại sau ít phút nhé.", 502);
  }

  const missing = REQUIRED[docType]
    .filter(({ key }) => (result.data as unknown as Record<string, unknown>)[key as string] == null)
    .map(({ label }) => label);

  let status: "hop_le" | "can_nop_lai" = "hop_le";
  let reason: string | null = null;
  if (!result.isExpectedDocument) {
    status = "can_nop_lai";
    reason = result.problem ?? "Tệp không đúng loại giấy tờ hoặc không đọc được.";
  } else if (missing.length > 0) {
    status = "can_nop_lai";
    reason = `Không đọc rõ ${missing.join(", ")}, vui lòng nộp ảnh rõ hơn.`;
  }

  try {
    const profileId = await ensureProfile();
    await saveDocument(profileId, docType, {
      fileName: safeFileName(file.name),
      status,
      reason,
      data: result.isExpectedDocument ? result.data : null,
    });
  } catch (err) {
    console.error("Saving document failed", err);
    return bad("Chưa lưu được hồ sơ, bạn thử lại sau ít phút nhé.", 500);
  }

  return Response.json({ status, reason });
}
