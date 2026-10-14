"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  ArrowUp,
  Check,
  ChevronDown,
  FileCode2,
  FilePlus2,
  FileX2,
  ImageIcon,
  Lock,
  MousePointerClick,
  Paperclip,
  RotateCcw,
  Sparkles,
  Square,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Menu, MenuContent, MenuItem, MenuTrigger, Switch, Tip } from "@/components/ui/misc";
import { IMAGE_CREDITS, TIERS, type ModelTier } from "@/config/models";
import { parseResponse, type Segment } from "@/lib/ai/protocol";
import type { Attachment, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PlanInfo, Selection, Streaming } from "./types";

type SendOpts = { prompt: string; tier: ModelTier; images: boolean; attachments: Attachment[]; selection: Selection | null };

type Props = {
  projectId: string;
  messages: Message[];
  streaming: Streaming | null;
  generating: boolean;
  credits: number;
  plan: PlanInfo;
  hasSite: boolean;
  selection: Selection | null;
  onClearSelection: () => void;
  onSend: (opts: SendOpts) => Promise<boolean>;
  onStop: () => void;
  onRestore: (versionId: string) => void;
  onUpgrade: (message: string) => void;
  /** The composer text lives in the builder so other panels can prefill a request. */
  input: string;
  onInputChange: (value: string) => void;
};

const QUICK_ACTIONS = [
  "Add a pricing section",
  "Add an FAQ with structured data",
  "Make the hero more striking",
  "Add a testimonials section with placeholders for real reviews",
  "Improve the mobile layout",
  "Add a blog page with 3 starter posts",
];

const TIER_KEY = "sl:tier";

export function modelLabel(id: string | null) {
  if (!id) return "";
  const name = id.split("/").pop() ?? id;
  return name
    .replace(/-/g, " ")
    .replace(/\b(\w)/g, (c) => c.toUpperCase())
    .replace(/\bGpt\b/, "GPT");
}

export function Chat(props: Props) {
  const { messages, streaming, generating, credits, plan, hasSite, selection } = props;
  const { input, onInputChange: setInput } = props;
  const [tier, setTier] = useState<ModelTier>(plan.tiers.includes("standard") ? "standard" : "fast");
  const [images, setImages] = useState(plan.aiImages);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stick = useRef(true);

  // Building a brand-new site (plan + every page) is priced as one flat "build".
  const cost = hasSite ? TIERS[tier].credits : TIERS[tier].buildCredits;
  const enough = credits >= cost;

  // Remember the last model choice (read after mount to keep SSR and hydration identical).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIER_KEY) as ModelTier | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore a saved preference after hydration
      if (saved && plan.tiers.includes(saved)) setTier(saved);
    } catch {}
  }, [plan.tiers]);

  const chooseTier = (t: ModelTier) => {
    setTier(t);
    try {
      localStorage.setItem(TIER_KEY, t);
    } catch {}
  };

  useEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, streaming?.raw, streaming?.status]);

  useEffect(() => {
    if (selection) inputRef.current?.focus();
  }, [selection]);

  async function submit(prompt = input) {
    const text = prompt.trim();
    if (!text || generating) return;
    if (!enough) {
      props.onUpgrade(`This message needs ${cost} credit${cost > 1 ? "s" : ""} and you have ${credits}. Switch to a cheaper model, wait for your free refill, or top up.`);
      return;
    }
    stick.current = true;
    const sentAttachments = attachments;
    setInput("");
    setAttachments([]);
    const ok = await props.onSend({ prompt: text, tier, images, attachments: sentAttachments, selection });
    if (!ok) {
      setInput(text);
      setAttachments(sentAttachments);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/projects/${props.projectId}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setAttachments((a) => [...a, data].slice(0, 6));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function enhance() {
    if (input.trim().length < 3) return toast("Write a few words first.");
    setEnhancing(true);
    try {
      const res = await fetch("/api/enhance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: input }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't enhance");
      setInput(data.prompt);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnhancing(false);
    }
  }

  const empty = messages.length === 0 && !streaming;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-5"
      >
        {empty && (
          <div className="pt-6 text-center">
            <Sparkles className="mx-auto size-6 text-accent" />
            <h2 className="mt-3 font-display text-3xl text-ink">What should we build?</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-2">
              Describe the business, the pages you need and the look you like. Details like your phone number help — or we&apos;ll leave
              placeholders.
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.content} attachments={m.attachments ?? []} />
          ) : (
            <AssistantMessage key={m.id} message={m} onRestore={props.onRestore} />
          ),
        )}

        {streaming && !messages.some((m) => m.id === streaming.messageId) && (
          <>
            <UserBubble text={streaming.userText} attachments={streaming.attachments} />
            <StreamingMessage streaming={streaming} />
          </>
        )}
        {!streaming && generating && (
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper/60 px-3.5 py-3 text-sm text-ink-2">
            <Spinner /> Still working on your last request…
          </div>
        )}

        {hasSite && !generating && messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_ACTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-xs text-ink-2 hover:border-line-2 hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line p-3">
        {(selection || attachments.length > 0) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selection && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-ink">
                <MousePointerClick className="size-3.5 shrink-0" />
                <span className="truncate">
                  Editing &lt;{selection.tag}&gt; {selection.text ? `“${selection.text.slice(0, 40)}”` : ""}
                </span>
                <button onClick={props.onClearSelection} aria-label="Clear selection" className="rounded-full p-0.5 hover:bg-accent/10">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {attachments.map((a) => (
              <span key={a.url} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-0.5 pr-2 text-xs text-ink-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt="" className="size-6 rounded-full object-cover" />
                <span className="max-w-[10ch] truncate">{a.name}</span>
                <button onClick={() => setAttachments((list) => list.filter((x) => x.url !== a.url))} aria-label={`Remove ${a.name}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-line-2 bg-card focus-within:border-ink/40">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            onPaste={(e) => {
              const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
              if (file) {
                e.preventDefault();
                void upload(file);
              }
            }}
            rows={3}
            placeholder={
              selection ? "What should change about the selected element?" : hasSite ? "Ask for a change, a new page or a new section…" : "Describe your site…"
            }
            className="block max-h-56 min-h-[76px] w-full resize-y bg-transparent px-3 pt-3 text-[14px] leading-relaxed text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
            <Tip label="Upload a logo, photo or screenshot">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-ink disabled:opacity-50"
                aria-label="Upload image"
              >
                {uploading ? <Spinner className="size-4" /> : <Paperclip className="size-4" />}
              </button>
            </Tip>
            <Tip label="Rewrite as a detailed brief (free)">
              <button onClick={enhance} disabled={enhancing} className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-ink disabled:opacity-50" aria-label="Enhance prompt">
                {enhancing ? <Spinner className="size-4" /> : <Wand2 className="size-4" />}
              </button>
            </Tip>
            {plan.aiImages && (
              <Tip label={`Generate custom photos (${IMAGE_CREDITS} credit each)`}>
                <label className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 text-xs text-muted">
                  <ImageIcon className="size-3.5" />
                  <Switch checked={images} onCheckedChange={setImages} aria-label="AI photos" className="h-4 w-7 [&>span]:size-3 [&>span]:data-[state=checked]:translate-x-[13px]" />
                </label>
              </Tip>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <Menu>
                <MenuTrigger className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ink-2 hover:bg-paper-2">
                  {TIERS[tier].label}
                  <ChevronDown className="size-3" />
                </MenuTrigger>
                <MenuContent className="w-64">
                  {Object.values(TIERS).map((t) => {
                    const allowed = plan.tiers.includes(t.id);
                    return (
                      <MenuItem
                        key={t.id}
                        disabled={!allowed}
                        onSelect={() => allowed && chooseTier(t.id)}
                        className="items-start data-[disabled]:opacity-50"
                      >
                        <span className="mt-0.5 w-4">{tier === t.id ? <Check className="size-4" /> : !allowed ? <Lock className="size-3.5" /> : null}</span>
                        <span className="flex-1">
                          <span className="flex justify-between font-medium">
                            {t.label}
                            <span className="text-muted">
                              {hasSite ? t.credits : t.buildCredits} credits
                            </span>
                          </span>
                          <span className="block text-xs text-muted">{allowed ? t.blurb : "Available on Pro"}</span>
                        </span>
                      </MenuItem>
                    );
                  })}
                </MenuContent>
              </Menu>
              {generating ? (
                <button
                  onClick={props.onStop}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-white hover:bg-ink-2"
                >
                  <Square className="size-3 fill-current" /> Stop
                </button>
              ) : (
                <button
                  onClick={() => submit()}
                  disabled={!input.trim()}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition-colors disabled:opacity-40",
                    enough ? "bg-accent hover:bg-accent-ink" : "bg-ink-2",
                  )}
                  title={enough ? `Costs ${cost} credits. Refunded if nothing changes.` : "Not enough credits"}
                >
                  {cost} <span className="font-normal opacity-80">credit{cost > 1 ? "s" : ""}</span>
                  <ArrowUp className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted">
          {credits} credits left · you&apos;re only charged when your site changes · click text in the preview to edit it free
        </p>
      </div>
    </div>
  );
}

function UserBubble({ text, attachments }: { text: string; attachments: Attachment[] }) {
  return (
    <div className="ml-8 flex flex-col items-end gap-1.5">
      {attachments.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {attachments.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={a.url} src={a.url} alt={a.name} className="size-14 rounded-xl border border-line object-cover" />
          ))}
        </div>
      )}
      <div className="whitespace-pre-wrap rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-[14px] leading-relaxed text-white">{text}</div>
    </div>
  );
}

function FileChip({ path, state }: { path: string; state: "new" | "edit" | "delete" | "writing" | "done" }) {
  const Icon = state === "delete" ? FileX2 : state === "new" ? FilePlus2 : FileCode2;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-paper-2/70 px-2 py-1 font-mono text-[11px] text-ink-2">
      {state === "writing" ? <Spinner className="size-3 text-accent" /> : <Icon className="size-3 text-muted" />}
      <span className="truncate">{path}</span>
      {state === "done" && <Check className="ml-auto size-3 text-ok" />}
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="chat-md text-[14px] leading-relaxed text-ink-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

function AssistantMessage({ message, onRestore }: { message: Message; onRestore: (id: string) => void }) {
  const failed = message.status === "error" || message.status === "cancelled";
  return (
    <div className="mr-4 space-y-2">
      {message.content && <Markdown text={message.content} />}
      {message.files_changed.length > 0 && (
        <div className="grid gap-1">
          {message.files_changed.map((f) => (
            <FileChip key={f} path={f} state="done" />
          ))}
        </div>
      )}
      {failed && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {message.error ?? "This request didn't complete."}
        </div>
      )}
      <div className="flex items-center gap-2 text-[11px] text-muted">
        {message.status === "done" && <span>{message.credits_charged ? `${message.credits_charged} credits` : "No charge"}</span>}
        {message.model && <span>· {modelLabel(message.model)}</span>}
        {message.version_id && (
          <button onClick={() => onRestore(message.version_id!)} className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-paper-2 hover:text-ink">
            <RotateCcw className="size-3" /> Restore this version
          </button>
        )}
      </div>
    </div>
  );
}

function StreamingMessage({ streaming }: { streaming: Streaming }) {
  const parsed = useMemo(() => parseResponse(streaming.raw), [streaming.raw]);
  const segments: Segment[] = parsed.segments;
  return (
    <div className="mr-4 space-y-2">
      {segments.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-ink-2">
          <Spinner className="text-accent" />
          {streaming.thinking ? "Planning the design…" : "Starting…"}
        </div>
      )}
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <Markdown key={i} text={seg.text} />
        ) : (
          <FileChip
            key={i}
            path={seg.kind === "file" && !seg.complete ? `${seg.path} · ${seg.content.split("\n").length} lines` : seg.path}
            state={!seg.complete ? "writing" : seg.kind === "delete" ? "delete" : seg.kind === "edit" ? "edit" : "done"}
          />
        ),
      )}
      {streaming.status && (
        <div className="flex items-center gap-2 text-xs text-ink-2">
          <Spinner className="size-3.5 text-accent" /> {streaming.status}
        </div>
      )}
    </div>
  );
}
