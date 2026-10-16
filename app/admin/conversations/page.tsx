import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listConversations } from "@/lib/chat-store";
import { formatDateTime } from "@/lib/format";

// Đọc dữ liệu thật từ database ở mỗi lần truy cập, không prerender lúc build.
export const dynamic = "force-dynamic";

export default async function AdminConversationsPage() {
  const conversations = await listConversations();

  return (
    <>
      <AdminPageHeader
        title="Hội thoại"
        description="Lịch sử hội thoại của khách với chatbot hỏi đáp trên trang chủ. Bấm vào một cuộc trò chuyện để xem từng tin nhắn."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Câu hỏi đầu tiên</TableHead>
              <TableHead>Số tin nhắn</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Tin gần nhất</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Chưa có cuộc trò chuyện nào.
                </TableCell>
              </TableRow>
            )}
            {conversations.map((conv) => (
              <TableRow key={conv.id} className="relative cursor-pointer hover:bg-muted/50">
                <TableCell className="max-w-xs truncate font-medium">
                  <Link
                    href={`/admin/conversations/${conv.id}`}
                    className="after:absolute after:inset-0"
                  >
                    {conv.firstQuestion ?? "(chưa có câu hỏi)"}
                  </Link>
                </TableCell>
                <TableCell>{conv.messageCount} tin nhắn</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(conv.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(conv.updatedAt)}
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
