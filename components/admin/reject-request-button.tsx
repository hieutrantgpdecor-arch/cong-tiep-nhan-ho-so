"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rejectRequestAction } from "@/app/admin/requests/actions";

export function RejectRequestButton({ id }: { id: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectRequestAction(id);
      if (result?.error) setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div
          className="flex items-center gap-1.5"
          title="Từ chối và xóa vĩnh viễn yêu cầu này?"
        >
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleReject}
            disabled={pending}
            className="text-white"
          >
            {pending ? "Đang xóa..." : "Xác nhận từ chối"}
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
          aria-label="Từ chối"
          onClick={() => setConfirming(true)}
        >
          <X className="size-3.5" />
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
