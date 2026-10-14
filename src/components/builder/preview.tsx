"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Highlighter, Laptop, MousePointer2, MousePointerClick, RotateCcw, Smartphone, Tablet, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Menu, MenuContent, MenuItem, MenuTrigger, Tip } from "@/components/ui/misc";
import { parseResponse } from "@/lib/ai/protocol";
import { buildPreviewDocument, hrefToPage } from "@/lib/site/render";
import type { FileMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Device, Selection } from "./types";

type Mode = "none" | "select" | "edit";

const WIDTHS: Record<Device, string> = { desktop: "100%", tablet: "820px", mobile: "390px" };

type Props = {
  files: FileMap;
  page: string;
  pages: string[];
  onPage: (page: string) => void;
  generating: boolean;
  streamingRaw: string;
  viewing: { id: string; label: string } | null;
  onExitViewing: () => void;
  onRestoreViewing: () => void;
  canSelect: boolean;
  selection: Selection | null;
  onSelect: (s: Selection) => void;
  onTextEdit: (id: string, html: string) => void;
  runtimeErrors: string[];
  onRuntimeError: (message: string) => void;
  onFixErrors: () => void;
  placeholders: number;
  onFillDetails: () => void;
  hasSite: boolean;
};

function pageLabel(p: string) {
  if (p === "index.html") return "Home";
  const name = p.replace(/\.html$/, "").replace(/[-_]/g, " ");
  return name[0].toUpperCase() + name.slice(1);
}

export function Preview(props: Props) {
  const { files, page, generating } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [mode, setMode] = useState<Mode>("none");
  const [loadedDoc, setLoadedDoc] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const scrollByPage = useRef<Record<string, number>>({});
  const pendingHash = useRef<string | null>(null);
  const propsRef = useRef(props);
  const modeRef = useRef(mode);
  useEffect(() => {
    propsRef.current = props;
    modeRef.current = mode;
  });

  const effectiveMode: Mode = props.canSelect ? mode : "none";

  const doc = useMemo(() => {
    if (!Object.keys(files).length) return null;
    try {
      return buildPreviewDocument(files, page, { annotate: !props.viewing });
    } catch (err) {
      console.error(err);
      return buildPreviewDocument(files, page);
    }
    // reloadKey forces a fresh render on demand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, page, props.viewing, reloadKey]);

  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);
  const loading = doc !== null && loadedDoc !== doc;

  const post = (msg: object) => iframeRef.current?.contentWindow?.postMessage({ sl: true, ...msg }, "*");

  useEffect(() => {
    post({ type: "mode", mode: effectiveMode });
  }, [effectiveMode]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const m = e.data as { sl?: boolean; type?: string; [k: string]: unknown };
      if (!m?.sl) return;
      const p = propsRef.current;
      switch (m.type) {
        case "ready":
          setLoadedDoc(docRef.current);
          post({ type: "mode", mode: p.canSelect ? modeRef.current : "none" });
          if (pendingHash.current) {
            post({ type: "hash", hash: pendingHash.current });
            pendingHash.current = null;
          } else post({ type: "scroll", y: scrollByPage.current[p.page] ?? 0 });
          if (p.selection && p.selection.page === p.page) post({ type: "highlight", id: p.selection.id });
          break;
        case "scroll":
          scrollByPage.current[p.page] = Number(m.y) || 0;
          break;
        case "navigate": {
          const target = hrefToPage(String(m.href));
          if (target && p.files[target.page] !== undefined) {
            pendingHash.current = target.hash || null;
            scrollByPage.current[target.page] = 0;
            p.onPage(target.page);
          } else toast(`"${String(m.href)}" doesn't exist yet. Ask the AI to add it.`);
          break;
        }
        case "select":
          p.onSelect({ id: String(m.id), tag: String(m.tag), text: String(m.text ?? ""), page: p.page });
          break;
        case "text-edit":
          p.onTextEdit(String(m.id), String(m.html));
          break;
        case "toast":
          toast(String(m.message));
          break;
        case "error":
          if (!p.generating) p.onRuntimeError(String(m.message).slice(0, 300));
          break;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const streamingFiles = useMemo(() => {
    if (!generating || !props.streamingRaw) return [];
    return parseResponse(props.streamingRaw).ops.map((o) => ({ path: o.path, done: o.complete }));
  }, [generating, props.streamingRaw]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-line bg-card px-2.5">
        <Menu>
          <MenuTrigger className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper-2" disabled={!props.pages.length}>
            {props.pages.length ? pageLabel(page) : "No pages"}
            <ChevronDown className="size-3" />
          </MenuTrigger>
          <MenuContent align="start">
            {props.pages.map((p) => (
              <MenuItem key={p} onSelect={() => props.onPage(p)}>
                <span className="flex-1">{pageLabel(p)}</span>
                <span className="font-mono text-[10px] text-muted">{p}</span>
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>

        <div className="mx-1 h-5 w-px bg-line" />
        <div className="flex items-center rounded-full bg-paper-2 p-0.5">
          {(
            [
              ["desktop", Laptop],
              ["tablet", Tablet],
              ["mobile", Smartphone],
            ] as const
          ).map(([d, Icon]) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={cn("rounded-full p-1.5", device === d ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}
              aria-label={`${d} preview`}
              aria-pressed={device === d}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>

        <div className="mx-1 h-5 w-px bg-line" />
        <div className="flex items-center gap-0.5">
          <Tip label="Point at an element, then tell the AI what to change">
            <button
              disabled={!props.canSelect}
              onClick={() => setMode((m) => (m === "select" ? "none" : "select"))}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-40",
                effectiveMode === "select" ? "bg-accent text-white" : "text-ink-2 hover:bg-paper-2",
              )}
            >
              <MousePointerClick className="size-3.5" /> <span className="hidden xl:inline">Select</span>
            </button>
          </Tip>
          <Tip label="Click any text and type. Free, no credits">
            <button
              disabled={!props.canSelect}
              onClick={() => setMode((m) => (m === "edit" ? "none" : "edit"))}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-40",
                effectiveMode === "edit" ? "bg-ink text-white" : "text-ink-2 hover:bg-paper-2",
              )}
            >
              <Type className="size-3.5" /> <span className="hidden xl:inline">Edit text</span>
            </button>
          </Tip>
        </div>

        {props.placeholders > 0 && !props.viewing && (
          <Tip label="Highlighted [[placeholders]] need your real details. Fill each one once and it's used everywhere.">
            <button
              onClick={props.onFillDetails}
              className="ml-1 hidden items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 sm:flex"
            >
              <Highlighter className="size-3.5" /> {props.placeholders} to fill in
            </button>
          </Tip>
        )}

        <div className="ml-auto flex items-center gap-1">
          {generating && (
            <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
              <Spinner className="size-3" /> Building
            </span>
          )}
          <Tip label="Reload preview">
            <button onClick={() => setReloadKey((k) => k + 1)} className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Reload preview">
              <RotateCcw className="size-3.5" />
            </button>
          </Tip>
        </div>
      </div>

      {props.viewing && (
        <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-medium">Viewing an earlier version:</span>
          <span className="truncate">{props.viewing.label}</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={props.onExitViewing}>
              Back to latest
            </Button>
            <Button size="sm" onClick={props.onRestoreViewing}>
              Restore this version
            </Button>
          </div>
        </div>
      )}

      {props.runtimeErrors.length > 0 && !generating && (
        <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="truncate">Script error: {props.runtimeErrors[0]}</span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={props.onFixErrors}>
            Fix it
          </Button>
        </div>
      )}

      {effectiveMode !== "none" && (
        <div className="border-b border-line bg-paper px-3 py-1.5 text-center text-xs text-ink-2">
          {effectiveMode === "select" ? (
            <>
              <MousePointer2 className="mr-1 inline size-3" /> Click an element to target it in chat
            </>
          ) : (
            <>
              <Type className="mr-1 inline size-3" /> Click text to edit it. Changes save when you click away (Esc cancels). Always free.
            </>
          )}
        </div>
      )}

      {/* canvas */}
      <div className="relative min-h-0 flex-1 overflow-auto bg-[repeating-linear-gradient(45deg,#efeae2_0_1px,transparent_1px_12px)] p-0 sm:p-3">
        {doc ? (
          <div className="mx-auto h-full transition-[width] duration-300" style={{ width: WIDTHS[device], maxWidth: "100%" }}>
            <iframe
              ref={iframeRef}
              key={reloadKey}
              title="Site preview"
              srcDoc={doc}
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
              className={cn("h-full w-full bg-white sm:rounded-xl sm:shadow-[0_10px_40px_-18px_rgba(28,25,23,0.45)]", device !== "desktop" && "sm:border sm:border-line-2")}
            />
            {loading && (
              <div className="pointer-events-none absolute right-6 top-6 rounded-full bg-card/90 p-2 shadow">
                <Spinner className="text-muted" />
              </div>
            )}
          </div>
        ) : generating ? (
          <BuildingPlaceholder files={streamingFiles} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="font-display text-4xl text-ink/70">Your site will appear here</p>
            <p className="mt-2 max-w-sm text-sm text-muted">Describe what you want in the chat. You&apos;ll watch it being built, page by page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BuildingPlaceholder({ files }: { files: { path: string; done: boolean }[] }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Spinner className="text-accent" /> Designing your site…
        </div>
        <div className="mt-5 space-y-2.5">
          {files.length === 0 &&
            [70, 90, 55].map((w, i) => (
              <div
                key={i}
                className="h-3 animate-shimmer rounded-full bg-[linear-gradient(90deg,#efeae2,#f6f3ee,#efeae2)] bg-[length:200%_100%]"
                style={{ width: `${w}%` }}
              />
            ))}
          {files.map((f) => (
            <div key={f.path} className="flex items-center gap-2 font-mono text-xs text-ink-2">
              {f.done ? <span className="size-2 rounded-full bg-ok" /> : <Spinner className="size-3 text-accent" />}
              {f.path}
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">A full site usually takes 1–3 minutes. You can keep this tab open or come back later.</p>
      </div>
    </div>
  );
}
