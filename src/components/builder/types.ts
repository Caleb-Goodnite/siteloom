import type { ModelTier } from "@/config/models";
import type { Attachment, Project } from "@/lib/types";

export type BuilderProject = Omit<Project, "files" | "published_files">;

export type PlanInfo = {
  id: string;
  name: string;
  tiers: ModelTier[];
  aiImages: boolean;
  customDomains: number;
  badge: boolean;
};

export type Selection = { id: string; tag: string; text: string; page: string };

export type Streaming = {
  messageId: string | null;
  userText: string;
  attachments: Attachment[];
  raw: string;
  status: string | null;
  thinking: boolean;
};

export type Panel = "preview" | "code" | "seo" | "forms" | "analytics" | "history" | "settings";

export type Device = "desktop" | "tablet" | "mobile";

export type ApiErrorBody = { error?: string; code?: string };
