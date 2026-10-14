"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  Code2,
  Coins,
  Eye,
  History,
  Inbox,
  MessageSquare,
  Rocket,
  Search,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/misc";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TIERS, type ModelTier } from "@/config/models";
import { applyOps, listPages, parseResponse } from "@/lib/ai/protocol";
import { auditSite } from "@/lib/site/seo";
import { applyTextEdit } from "@/lib/site/render";
import type { Attachment, FileMap, Message, ProjectVersion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnalyticsPanel } from "./analytics-panel";
import { Chat } from "./chat";
import { CodePanel } from "./code-panel";
import { FormsPanel } from "./forms-panel";
import { HistoryPanel } from "./history-panel";
import { Preview } from "./preview";
import { PublishDialog } from "./publish-dialog";
import { SeoPanel } from "./seo-panel";
import { SettingsPanel } from "./settings-panel";
import type { ApiErrorBody, BuilderProject, Panel, PlanInfo, Selection, Streaming } from "./types";

type Props = {
  project: BuilderProject;
  files: FileMap;
  messages: Message[];
  versions: ProjectVersion[];
  credits: number;
  plan: PlanInfo;
};

const TABS: { id: Panel; label: string; icon: typeof Eye }[] = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "code", label: "Code", icon: Code2 },
  { id: "seo", label: "SEO", icon: Search },
  { id: "forms", label: "Forms", icon: Inbox },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function Builder(props: Props) {
  const [project, setProject] = useState(props.project);
  const [files, setFiles] = useState<FileMap>(props.files);
  const [messages, setMessages] = useState<Message[]>(props.messages);
  const [versions, setVersions] = useState<ProjectVersion[]>(props.versions);
  const [credits, setCredits] = useState(props.credits);
  const [panel, setPanel] = useState<Panel>("preview");
  const [mobileView, setMobileView] = useState<"chat" | "site">("chat");
  const [page, setPage] = useState("index.html");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [streaming, setStreaming] = useState<Streaming | null>(null);
  const [liveFiles, setLiveFiles] = useState<FileMap | null>(null);
  const [viewing, setViewing] = useState<{ id: string; label: string; files: FileMap } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [upgrade, setUpgrade] = useState<string | null>(null);
  const [runtimeErrors, setRuntimeErrors] = useState<string[]>([]);
  const lastLiveUpdate = useRef(0);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const generating = streaming !== null || project.status === "generating";
  const pages = useMemo(() => listPages(viewing?.files ?? files), [files, viewing]);
  // The selected page may disappear (deleted, or viewing an old version): fall back to the first page.
  const currentPage = pages.includes(page) ? page : (pages[0] ?? "index.html");
  const seo = useMemo(() => (Object.keys(files).length ? auditSite(files) : null), [files]);
  const unpublishedChanges = project.published && project.published_at ? new Date(project.updated_at) > new Date(project.published_at) : false;


  const refreshProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (!res.ok) return;
    const data = await res.json();
    const { files: f, ...rest } = data.project;
    setProject(rest);
    setFiles(f);
    setMessages(data.messages);
    setVersions(data.versions);
  }, [project.id]);

  // Reloaded mid-generation (or generating in another tab): poll until it finishes.
  useEffect(() => {
    if (streaming || project.status !== "generating") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/projects/${project.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.project.status !== "generating") {
        const { files: f, ...rest } = data.project;
        setProject(rest);
        setFiles(f);
        setMessages(data.messages);
        setVersions(data.versions);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [project.status, project.id, streaming]);

  const handleApiError = useCallback((status: number, body: ApiErrorBody) => {
    const msg = body.error ?? "Something went wrong.";
    if (status === 402 || body.code === "upgrade" || body.code === "credits") setUpgrade(msg);
    else toast.error(msg);
  }, []);

  // ───────────────────────── generation ─────────────────────────
  const send = useCallback(
    async (opts: { prompt: string; tier: ModelTier; images: boolean; attachments: Attachment[]; selection: Selection | null }) => {
      if (streaming) return false;
      setViewing(null);
      setRuntimeErrors([]);
      setStreaming({ messageId: null, userText: opts.prompt, attachments: opts.attachments, raw: "", status: null, thinking: false });
      setMobileView("chat");

      let res: Response;
      try {
        res = await fetch(`/api/projects/${project.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: opts.prompt,
            tier: opts.tier,
            images: opts.images,
            attachments: opts.attachments,
            selection: opts.selection ? { id: opts.selection.id, page: opts.selection.page } : null,
          }),
        });
      } catch {
        setStreaming(null);
        toast.error("Network error. Check your connection and try again.");
        return false;
      }
      if (!res.ok || !res.body) {
        setStreaming(null);
        handleApiError(res.status, await res.json().catch(() => ({})));
        return false;
      }

      setProject((p) => ({ ...p, status: "generating" }));
      setSelection(null);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let raw = "";
      let finished = false;
      let lastParse = 0;
      let completedSeen = 0;

      // Re-parsing the whole response is O(n), so do it a few times a second, not per token.
      const sync = (force: boolean) => {
        const now = Date.now();
        if (!force && now - lastParse < 250) return;
        lastParse = now;
        setStreaming((s) => (s ? { ...s, raw, thinking: false } : s));
        const parsed = parseResponse(raw);
        const completed = parsed.ops.filter((o) => o.complete).length;
        const newFileDone = completed !== completedSeen;
        completedSeen = completed;
        // Refresh the preview when a file finishes, and every ~2s while a page is streaming in.
        if (!newFileDone && now - lastLiveUpdate.current < 2000) return;
        const ops = parsed.ops.filter((o) => o.complete || (o.kind === "file" && o.path.endsWith(".html")));
        if (!ops.length) return;
        lastLiveUpdate.current = now;
        setLiveFiles(applyOps(filesRef.current, ops, { includeIncomplete: true }).files);
        const current = parsed.ops[parsed.ops.length - 1];
        if (current && !current.complete && current.kind === "file" && current.path.endsWith(".html") && !current.path.includes("/")) {
          setPage(current.path);
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (!line.trim()) continue;
            const ev = JSON.parse(line);
            switch (ev.t) {
              case "start":
                setStreaming((s) => (s ? { ...s, messageId: ev.messageId } : s));
                setCredits((c) => c - ev.credits);
                break;
              case "delta":
                raw += ev.d;
                sync(false);
                break;
              case "thinking":
                setStreaming((s) => (s ? { ...s, thinking: true } : s));
                break;
              case "status":
                sync(true);
                setStreaming((s) => (s ? { ...s, status: ev.s } : s));
                break;
              case "files":
                setFiles(ev.files);
                setLiveFiles(null);
                break;
              case "done":
                finished = true;
                setFiles(ev.files);
                setCredits(ev.credits);
                break;
              case "error":
                finished = true;
                toast.error(ev.error);
                break;
            }
          }
        }
      } catch {
        // Stream dropped (network/timeout): the server keeps working; we resync below.
      }
      sync(true);
      await refreshProject();
      setStreaming(null);
      setLiveFiles(null);
      if (!finished) toast("Connection interrupted. Your site is still being built and will appear here when it's done.");
      return true;
    },
    [streaming, project.id, handleApiError, refreshProject],
  );

  const stop = useCallback(async () => {
    await fetch(`/api/projects/${project.id}/generate`, { method: "DELETE" });
    toast("Stopping… you won't be charged.");
  }, [project.id]);

  // First visit after creating a project: send the prompt typed on the dashboard automatically.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    if (props.messages.length === 0 && Object.keys(props.files).length === 0 && props.project.initial_prompt && props.project.status === "idle") {
      const tier: ModelTier = props.plan.tiers.includes("standard") && props.credits >= TIERS.standard.credits ? "standard" : "fast";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time kickoff of the first build
      void send({ prompt: props.project.initial_prompt, tier, images: props.plan.aiImages, attachments: [], selection: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────── free edits ─────────────────────────
  const saveTextEdit = useCallback(
    async (id: string, html: string) => {
      const before = filesRef.current;
      const next = applyTextEdit(before, id, html);
      if (!next) return;
      setFiles(next);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textEdit: { id, html } }),
      });
      if (!res.ok) {
        setFiles(before);
        handleApiError(res.status, await res.json().catch(() => ({})));
        return;
      }
      const data = await res.json();
      setFiles(data.project.files);
      setProject((p) => ({ ...p, updated_at: data.project.updated_at }));
      toast.success("Saved · free edit", { duration: 1200 });
    },
    [project.id, handleApiError],
  );

  const saveFiles = useCallback(
    async (changes: Record<string, string | null>) => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: changes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        handleApiError(res.status, data);
        return false;
      }
      setFiles(data.project.files);
      setProject((p) => ({ ...p, updated_at: data.project.updated_at }));
      void refreshProject();
      return true;
    },
    [project.id, handleApiError, refreshProject],
  );

  const previewFiles = viewing?.files ?? liveFiles ?? files;
  const hasSite = Object.keys(files).length > 0;
  const canSelect = !viewing && !generating && hasSite;

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-card px-3">
        <Link href="/dashboard" className="flex items-center gap-1 rounded-full p-1 pr-2 text-ink-2 hover:bg-paper-2" aria-label="Back to dashboard">
          <ChevronLeft className="size-4" />
          <LogoMark className="size-6" />
        </Link>
        <div className="min-w-0">
          <p className="max-w-[16ch] truncate text-sm font-semibold text-ink sm:max-w-[24ch]">{project.name}</p>
          <p className="text-[11px] text-muted">
            {generating ? "Building…" : project.published ? (unpublishedChanges ? "Live · unpublished changes" : "Live") : "Draft"}
          </p>
        </div>

        <nav className="mx-auto hidden items-center gap-0.5 rounded-full bg-paper-2 p-0.5 md:flex" aria-label="Builder panels">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setPanel(t.id);
                setMobileView("site");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                panel === t.id ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink",
              )}
              aria-pressed={panel === t.id}
            >
              <t.icon className="size-3.5" />
              <span className="hidden lg:inline">{t.label}</span>
              {t.id === "seo" && seo && (
                <span className={cn("rounded-full px-1.5 text-[10px]", seo.score >= 85 ? "bg-green-100 text-green-800" : seo.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800")}>
                  {seo.score}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/dashboard/billing" className="hidden items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink sm:flex" title="Credits">
            <Coins className="size-3.5 text-accent" /> {credits}
          </Link>
          <ThemeToggle />
          <Button size="sm" variant={project.published && !unpublishedChanges ? "outline" : "accent"} onClick={() => setPublishOpen(true)} disabled={!hasSite}>
            <Rocket className="size-3.5" />
            {project.published ? (unpublishedChanges ? "Update" : "Published") : "Publish"}
          </Button>
        </div>
      </header>

      {/* Mobile switcher */}
      <div className="flex border-b border-line bg-card md:hidden">
        {(["chat", "site"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={cn("flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium", mobileView === v ? "border-b-2 border-ink text-ink" : "text-muted")}
          >
            {v === "chat" ? <MessageSquare className="size-3.5" /> : <Eye className="size-3.5" />}
            {v === "chat" ? "Chat" : "Site"}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className={cn("w-full shrink-0 flex-col border-r border-line bg-card md:flex md:w-[400px]", mobileView === "chat" ? "flex" : "hidden")}>
          <Chat
            projectId={project.id}
            messages={messages}
            streaming={streaming}
            generating={generating}
            credits={credits}
            plan={props.plan}
            hasSite={hasSite}
            selection={selection}
            onClearSelection={() => setSelection(null)}
            onSend={send}
            onStop={stop}
            onRestore={async (versionId) => {
              const res = await fetch(`/api/projects/${project.id}/versions/${versionId}`, { method: "POST" });
              const data = await res.json();
              if (!res.ok) return handleApiError(res.status, data);
              setFiles(data.files);
              setVersions((v) => [data.version, ...v]);
              toast.success("Restored");
            }}
            onUpgrade={setUpgrade}
          />
        </aside>

        <section className={cn("min-w-0 flex-1 flex-col", mobileView === "site" ? "flex" : "hidden md:flex")}>
          {/* Mobile panel tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-line bg-card px-2 py-1.5 md:hidden">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setPanel(t.id)} className={cn("shrink-0 rounded-full px-3 py-1 text-xs", panel === t.id ? "bg-ink text-white" : "text-ink-2")}>
                {t.label}
              </button>
            ))}
          </div>
          {panel === "preview" && (
            <Preview
              files={previewFiles}
              page={currentPage}
              pages={pages}
              onPage={setPage}
              generating={generating}
              streamingRaw={streaming?.raw ?? ""}
              viewing={viewing}
              onExitViewing={() => setViewing(null)}
              onRestoreViewing={async () => {
                if (!viewing) return;
                const res = await fetch(`/api/projects/${project.id}/versions/${viewing.id}`, { method: "POST" });
                const data = await res.json();
                if (!res.ok) return handleApiError(res.status, data);
                setFiles(data.files);
                setVersions((v) => [data.version, ...v]);
                setViewing(null);
                toast.success("Version restored");
              }}
              canSelect={canSelect}
              selection={selection}
              onSelect={(s) => {
                setSelection(s);
                setMobileView("chat");
              }}
              onTextEdit={saveTextEdit}
              runtimeErrors={runtimeErrors}
              onRuntimeError={(m) => setRuntimeErrors((e) => (e.includes(m) || e.length > 5 ? e : [...e, m]))}
              onFixErrors={() =>
                send({
                  prompt: `The site shows these JavaScript errors in the browser. Please fix them without changing anything else:\n${runtimeErrors.map((e) => `- ${e}`).join("\n")}`,
                  tier: "fast",
                  images: false,
                  attachments: [],
                  selection: null,
                })
              }
              placeholders={seo?.placeholders ?? 0}
              hasSite={hasSite}
            />
          )}
          {panel === "code" && <CodePanel files={files} onSave={saveFiles} disabled={generating} />}
          {panel === "seo" && (
            <SeoPanel
              report={seo}
              generating={generating}
              canFast={props.plan.tiers.includes("fast")}
              onFix={(prompt) => {
                setPanel("preview");
                void send({ prompt, tier: "fast", images: false, attachments: [], selection: null });
              }}
            />
          )}
          {panel === "forms" && <FormsPanel projectId={project.id} published={project.published} />}
          {panel === "analytics" && <AnalyticsPanel projectId={project.id} published={project.published} />}
          {panel === "history" && (
            <HistoryPanel
              projectId={project.id}
              versions={versions}
              viewingId={viewing?.id ?? null}
              onView={(v) => {
                setViewing(v);
                setPanel("preview");
              }}
              onRestored={(f, v) => {
                setFiles(f);
                setVersions((list) => [v, ...list]);
                setViewing(null);
              }}
              onError={handleApiError}
            />
          )}
          {panel === "settings" && (
            <SettingsPanel
              project={project}
              onSaved={(p) => setProject((prev) => ({ ...prev, ...p }))}
              onError={handleApiError}
            />
          )}
        </section>
      </div>

      <PublishDialog
        key={publishOpen ? "open" : "closed"}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        project={project}
        plan={props.plan}
        seoScore={seo?.score ?? null}
        placeholders={seo?.placeholders ?? 0}
        unpublishedChanges={unpublishedChanges}
        onProject={(p) => setProject((prev) => ({ ...prev, ...p }))}
        onError={handleApiError}
      />

      <Dialog open={upgrade !== null} onOpenChange={(o) => !o && setUpgrade(null)} title="You need more credits" description={upgrade ?? ""}>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setUpgrade(null)}>
            Not now
          </Button>
          <Link href="/dashboard/billing" className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-ink">
            See plans & top-ups
          </Link>
        </div>
      </Dialog>
    </div>
  );
}
