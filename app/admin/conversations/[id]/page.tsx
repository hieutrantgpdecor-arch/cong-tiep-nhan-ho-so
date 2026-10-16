import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { getConversation } from "@/lib/chat-store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  return (
    <>
      <Link
        href="/admin/conversations"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tất cả hội thoại
      </Link>

      <AdminPageHeader
        title="Chi tiết hội thoại"
        description={`Bắt đầu ${formatDateTime(conversation.createdAt)} · ${conversation.messages.length} tin nhắn · Mã ${conversation.id}`}
      />

      <Card className="max-w-3xl space-y-4 p-6">
        {conversation.messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Cuộc trò chuyện này chưa có tin nhắn.</p>
        )}
        {conversation.messages.map((m) => {
          const fromCustomer = m.role === "user";
          return (
            <div key={m.id} className={cn("flex flex-col", fromCustomer ? "items-end" : "items-start")}>
              <span className="mb-1 text-xs text-muted-foreground">
                {fromCustomer ? "Khách" : "Chatbot"} · {formatDateTime(m.createdAt)}
              </span>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                  fromCustomer
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
