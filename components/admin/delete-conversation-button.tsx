"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteConversationAction } from "@/app/admin/conversations/actions";

export function DeleteConversationButton({
  id,
  goToList = false,
  className,
}: {
  id: string;
  goToList?: boolean;
  className?: string;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteConversationAction(id, goToList);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
          className="text-destructive"
        >
          <Trash2 />
          Xóa
        </Button>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5" title="Xóa vĩnh viễn cuộc trò chuyện này?">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={pending}
          className="text-white"
        >
          {pending ? "Đang xóa..." : "Xác nhận"}
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
    </div>
  );
}
