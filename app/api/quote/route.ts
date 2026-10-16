import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PACKAGE_PRICES } from "@/lib/pricing";
import { parseQuoteInput } from "@/lib/quote";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const input = parseQuoteInput(body);
  if (!input) {
    return Response.json(
      { error: "Vui lòng kiểm tra lại quốc gia, bậc học, gói dịch vụ, email và số điện thoại." },
      { status: 400 },
    );
  }

  // Giá luôn tính ở server từ bảng giá, bỏ qua mọi giá do trình duyệt gửi lên.
  const quote = PACKAGE_PRICES[input.package];

  try {
    const { error } = await getSupabaseAdmin().from("requests").insert({
      country: input.country,
      degree_level: input.degreeLevel,
      package: input.package,
      quote_vnd: quote,
      email: input.email,
      phone: input.phone,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Saving quote request failed", err);
    return Response.json(
      { error: "Chưa lưu được yêu cầu, bạn thử lại sau ít phút nhé." },
      { status: 500 },
    );
  }

  return Response.json({ quote, package: input.package });
}
