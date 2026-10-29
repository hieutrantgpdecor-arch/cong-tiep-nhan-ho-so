"use server";

import { revalidatePath } from "next/cache";
import { isApprovalWebhookConfigured, sendApprovalWebhook } from "@/lib/approval-webhook";
import {
  claimRequestForApproval,
  deletePendingRequest,
  isValidRequestId,
  revertApproval,
} from "@/lib/request-store";

export async function rejectRequestAction(id: string): Promise<{ error: string } | void> {
  if (!isValidRequestId(id)) return { error: "Mã yêu cầu không hợp lệ." };

  try {
    const deleted = await deletePendingRequest(id);
    if (!deleted) {
      revalidatePath("/admin/requests");
      return { error: "Yêu cầu này không còn ở trạng thái chờ duyệt." };
    }
  } catch (err) {
    console.error("Reject request failed", err);
    return { error: "Chưa từ chối được, bạn thử lại sau ít phút nhé." };
  }

  revalidatePath("/admin/requests");
}

export async function approveRequestAction(id: string): Promise<{ error: string } | void> {
  if (!isValidRequestId(id)) return { error: "Mã yêu cầu không hợp lệ." };
  if (!isApprovalWebhookConfigured()) {
    return { error: "Chưa cấu hình webhook gửi link đăng nhập (APPROVAL_WEBHOOK_URL)." };
  }

  let request;
  try {
    request = await claimRequestForApproval(id);
  } catch (err) {
    console.error("Approve request failed", err);
    return { error: "Chưa duyệt được, bạn thử lại sau ít phút nhé." };
  }
  if (!request) {
    revalidatePath("/admin/requests");
    return { error: "Yêu cầu này không còn ở trạng thái chờ duyệt." };
  }

  try {
    await sendApprovalWebhook({ fullName: request.fullName, email: request.email });
  } catch (err) {
    console.error("Approval webhook failed", err);
    // Chưa gửi được link cho khách thì trả yêu cầu về chờ duyệt để admin thử lại.
    await revertApproval(id).catch((e) => console.error("Revert approval failed", e));
    revalidatePath("/admin/requests");
    return { error: "Chưa gửi được link đăng nhập cho khách nên chưa duyệt. Bạn thử lại nhé." };
  }

  revalidatePath("/admin/requests");
}
