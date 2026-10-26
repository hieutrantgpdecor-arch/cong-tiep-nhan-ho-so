export interface QuoteWebhookPayload {
  fullName: string;
  email: string;
  package: string;
  quoteVnd: number;
}

// Báo cho Make.com biết có yêu cầu báo giá mới. Lỗi chỉ được ghi log: yêu cầu đã lưu
// vào database rồi nên không được làm hỏng phản hồi cho khách.
export async function notifyQuoteWebhook(payload: QuoteWebhookPayload): Promise<void> {
  const url = process.env.QUOTE_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: payload.fullName,
        email: payload.email,
        package: payload.package,
        quote_vnd: payload.quoteVnd,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("Quote webhook responded", res.status);
  } catch (err) {
    console.error("Quote webhook failed", err);
  }
}
