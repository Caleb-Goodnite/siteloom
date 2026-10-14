"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId, projectId, blocked }: { reportId: string; projectId: string | null; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function call(url: string, body: object, key: string) {
    setBusy(key);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    if (!res.ok) toast.error((await res.json()).error ?? "Failed");
    router.refresh();
  }

  return (
    <div className="mt-2 flex gap-2">
      {projectId && (
        <Button
          size="sm"
          variant={blocked ? "outline" : "danger"}
          loading={busy === "block"}
          onClick={() => call(`/api/admin/projects/${projectId}`, { action: blocked ? "unblock" : "block" }, "block")}
        >
          {blocked ? "Unblock site" : "Take site down"}
        </Button>
      )}
      <Button size="sm" variant="ghost" loading={busy === "dismiss"} onClick={() => call(`/api/admin/reports/${reportId}`, { status: "dismissed" }, "dismiss")}>
        Dismiss
      </Button>
    </div>
  );
}
