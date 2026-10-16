"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractLeadAction } from "@/app/admin/conversations/actions";

export function ExtractLeadButton({ id, hasLead }: { id: string; hasLead: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await extractLeadAction(id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <Button type="button" size="sm" onClick={handleClick} disabled={pending}>
        <Sparkles />
        {pending ? "Đang trích xuất..." : hasLead ? "Trích xuất lại" : "Trích xuất lead"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
