import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư — DuHoc24",
  description:
    "DuHoc24 thu thập những thông tin nào, dùng để làm gì, lưu ở đâu và cách yêu cầu xóa dữ liệu của bạn.",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Chúng tôi thu thập thông tin gì",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-medium text-foreground">Tài khoản Google:</strong> email và tên
          hiển thị khi bạn đăng nhập bằng Google.
        </li>
        <li>
          <strong className="font-medium text-foreground">Thông tin bạn điền trong form:</strong> họ
          tên, email, số điện thoại, quốc gia muốn du học, bậc học và gói dịch vụ trong form báo giá;
          nội dung bạn nhắn cho chatbot hỏi đáp.
        </li>
        <li>
          <strong className="font-medium text-foreground">Giấy tờ bạn tải lên:</strong> bảng điểm,
          chứng chỉ IELTS, CCCD/hộ chiếu. Hệ thống đọc giấy tờ bằng AI và chỉ lưu các thông tin được
          trích xuất (ví dụ họ tên, điểm số, số giấy tờ), không lưu file gốc.
        </li>
      </ul>
    ),
  },
  {
    title: "2. Mục đích sử dụng",
    body: (
      <p>
        Chỉ để xử lý hồ sơ du học của bạn: gửi báo giá, liên hệ tư vấn, kiểm tra giấy tờ, đối chiếu
        điểm với điểm chuẩn của các trường và gửi thông tin đăng nhập sau khi hồ sơ được duyệt. Chúng
        tôi không bán dữ liệu của bạn và không dùng vào mục đích quảng cáo của bên thứ ba.
      </p>
    ),
  },
  {
    title: "3. Dữ liệu được lưu ở đâu",
    body: (
      <>
        <p>
          Dữ liệu được lưu trên <strong className="font-medium text-foreground">Supabase</strong>{" "}
          (cơ sở dữ liệu máy chủ đặt tại Singapore), chỉ máy chủ của chúng tôi truy cập được; trình
          duyệt không đọc trực tiếp được bảng dữ liệu khách hàng.
        </p>
        <p className="mt-3">Để vận hành, một phần dữ liệu đi qua các dịch vụ sau:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Google (Gemini): đọc giấy tờ bạn tải lên và trả lời câu hỏi trong chatbot.
          </li>
          <li>
            Make.com: chuyển thông báo cho đội ngũ khi có yêu cầu báo giá mới (họ tên, email, gói, giá)
            và khi gửi link đăng nhập sau khi duyệt hồ sơ.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Yêu cầu xóa dữ liệu",
    body: (
      <p>
        Bạn có thể yêu cầu xóa dữ liệu của mình bất kỳ lúc nào bằng cách gửi email tới{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-foreground underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        từ địa chỉ email bạn đã dùng khi đăng ký. Chúng tôi sẽ xác nhận và xóa dữ liệu liên quan
        trong thời gian sớm nhất.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32">
        <h1 className="text-balance text-3xl font-medium tracking-tight md:text-4xl">
          Chính sách quyền riêng tư
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Cập nhật lần cuối: 31/10/2026</p>
        <p className="mt-6 text-muted-foreground">
          DuHoc24 chỉ thu thập những gì cần thiết để xử lý hồ sơ du học của bạn. Dưới đây là thông tin
          được thu thập, mục đích sử dụng, nơi lưu trữ và cách yêu cầu xóa dữ liệu.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-medium">{s.title}</h2>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
