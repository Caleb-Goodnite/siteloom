"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label } from "@/components/ui/field";
import { Dialog, Switch } from "@/components/ui/misc";
import { createClient } from "@/lib/supabase/client";

export function SettingsForm(props: { email: string; name: string; emailNotifications: boolean; hasSubscription: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(props.name);
  const [notify, setNotify] = useState(props.emailNotifications);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function save(patch: object) {
    setSaving(true);
    const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setSaving(false);
    if (res.ok) {
      toast.success("Saved");
      router.refresh();
    } else toast.error((await res.json()).error ?? "Could not save");
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
    if (!res.ok) {
      setDeleting(false);
      toast.error((await res.json()).error ?? "Could not delete account");
      return;
    }
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-line bg-card p-6">
        <h2 className="font-semibold text-ink">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={props.email} disabled />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <Button loading={saving} onClick={() => save({ full_name: name })}>
            Save
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-6">
        <h2 className="font-semibold text-ink">Notifications</h2>
        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-ink">Form submission emails</p>
            <Hint className="mt-0.5">Get an email whenever someone submits a form on one of your sites (paid plans).</Hint>
          </div>
          <Switch
            checked={notify}
            onCheckedChange={(v) => {
              setNotify(v);
              void save({ email_notifications: v });
            }}
            aria-label="Form submission emails"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-card p-6">
        <h2 className="font-semibold text-danger">Delete account</h2>
        <p className="mt-1 text-sm text-ink-2">
          Permanently deletes your account, all sites (they go offline), history, form submissions and uploaded images.
          {props.hasSubscription ? " Your subscription is canceled immediately." : ""} Download any sites you want to keep first.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmOpen(true)}>
          Delete my account
        </Button>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete your account?" description="This cannot be undone. Type DELETE to confirm.">
        <div className="space-y-4">
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={confirmText !== "DELETE"} loading={deleting} onClick={deleteAccount}>
              Delete forever
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
