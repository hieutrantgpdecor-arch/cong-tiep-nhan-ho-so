"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteConversation, getConversation, isValidConversationId } from "@/lib/chat-store";
import { extractLead } from "@/lib/lead-extractor";
import { saveLead } from "@/lib/lead-store";

export async function extractLeadAction(id: string): Promise<{ error: string } | void> {
  if (!isValidConversationId(id)) return { error: "Mã cuộc trò chuyện không hợp lệ." };

  const conversation = await getConversation(id).catch(() => null);
  if (!conversation) return { error: "Không tìm thấy cuộc trò chuyện." };
  if (!conversation.messages.some((m) => m.role === "user")) {
    return { error: "Cuộc trò chuyện chưa có tin nhắn nào của khách." };
  }

  try {
    const lead = await extractLead(conversation.messages);
    await saveLead(id, lead, conversation.messages.length);
  } catch (err) {
    console.error("Extract lead failed", err);
    return { error: "Chưa trích xuất được, bạn thử lại sau ít phút nhé." };
  }

  revalidatePath(`/admin/conversations/${id}`);
  revalidatePath("/admin/conversations");
}

export async function deleteConversationAction(
  id: string,
  goToList: boolean,
): Promise<{ error: string } | void> {
  if (!isValidConversationId(id)) return { error: "Mã cuộc trò chuyện không hợp lệ." };

  try {
    await deleteConversation(id);
  } catch (err) {
    console.error("Delete conversation failed", err);
    return { error: "Không xóa được, bạn thử lại nhé." };
  }

  revalidatePath("/admin/conversations");
  if (goToList) redirect("/admin/conversations");
}
