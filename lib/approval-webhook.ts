import "server-only";

export interface ApprovalWebhookPayload {
  fullName: string;
  email: string;
}

export function isApprovalWebhookConfigured(): boolean {
  return Boolean(process.env.APPROVAL_WEBHOOK_URL);
}

// Link đăng nhập gửi cho khách. Tuần này là link mẫu (/login chưa có); khi có trang đăng nhập
// thật chỉ cần đổi APPROVAL_LOGIN_URL, phía Make.com không phải sửa gì.
function loginUrl(): string {
  const configured = process.env.APPROVAL_LOGIN_URL;
  if (configured) return configured;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/login`;
}

// Báo cho Make.com một yêu cầu vừa được duyệt. Ném lỗi nếu gửi không thành công để
// người gọi hoàn tác việc duyệt (khách chưa nhận được link thì chưa coi là đã duyệt).
export async function sendApprovalWebhook(payload: ApprovalWebhookPayload): Promise<void> {
  const url = process.env.APPROVAL_WEBHOOK_URL;
  if (!url) throw new Error("APPROVAL_WEBHOOK_URL is not set");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: payload.fullName,
      email: payload.email,
      login_url: loginUrl(),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Approval webhook responded ${res.status}`);
}
