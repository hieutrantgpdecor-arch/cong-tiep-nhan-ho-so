"use client";

import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveRequestAction } from "@/app/admin/requests/actions";

export function ApproveRequestButton({ id }: { id: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveRequestAction(id);
      if (result?.error) setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div
          className="flex items-center gap-1.5"
          title="Duyệt và gửi link đăng nhập cho khách?"
        >
          <Button type="button" size="sm" onClick={handleApprove} disabled={pending}>
            {pending ? "Đang duyệt..." : "Xác nhận duyệt"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            Hủy
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Duyệt"
          onClick={() => setConfirming(true)}
        >
          <Check className="size-3.5" />
        </Button>
      )}
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
