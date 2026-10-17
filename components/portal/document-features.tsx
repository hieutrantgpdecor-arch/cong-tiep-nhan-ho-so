"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileText, IdCard, Loader2, Medal, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DocStatusBadge } from "@/components/status-badge";
import {
  DOC_ACCEPT,
  DOC_LABELS,
  MAX_UPLOAD_BYTES,
  type DocStatusValue,
  type DocType,
} from "@/lib/documents";

const ICONS: Record<DocType, LucideIcon> = {
  transcript: FileText,
  ielts: Medal,
  identity: IdCard,
};

export interface DocumentCardState {
  type: DocType;
  fileName: string | null;
  status: DocStatusValue;
  reason: string | null;
}

function UploadCard({ doc }: { doc: DocumentCardState }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const Icon = ICONS[doc.type];
  const accept = DOC_ACCEPT[doc.type];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Tệp quá lớn, vui lòng chọn tệp nhỏ hơn ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("type", doc.type);
      body.append("file", file);
      const res = await fetch("/api/portal/documents", { method: "POST", body });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Chưa tải lên được, bạn thử lại nhé.");
        return;
      }
      router.refresh();
    } catch {
      setError("Chưa tải lên được, bạn thử lại nhé.");
    } finally {
      setUploading(false);
    }
  }

  const status: DocStatusValue = uploading ? "dang_xu_ly" : doc.status;

  return (
    <div>
      <Card className="flex aspect-video flex-col items-center justify-center gap-2 border-none bg-foreground/5 p-6 shadow-none ring-0">
        <Icon className="size-7 text-muted-foreground" />
        <span className="max-w-full truncate px-4 text-xs text-muted-foreground">
          {uploading ? "Đang đọc tệp bằng Gemini..." : (doc.fileName ?? "Chưa có tệp")}
        </span>
      </Card>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{DOC_LABELS[doc.type]}</h3>
          <DocStatusBadge status={status} />
        </div>
        <p className="mt-3 text-balance text-muted-foreground">
          {!uploading && doc.status === "can_nop_lai" && doc.reason ? (
            <>
              Cần nộp lại: <span className="text-red-600">{doc.reason}</span>
            </>
          ) : (
            accept.hint
          )}
        </p>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept.mime.join(",")}
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {doc.status === "chua_nop" ? "Chọn tệp" : "Nộp lại"}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function DocumentFeatures({ items }: { items: DocumentCardState[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {items.map((doc) => (
        <UploadCard key={doc.type} doc={doc} />
      ))}
    </div>
  );
}
