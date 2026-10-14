import { after } from "next/server";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { api, ApiError, rateLimit, requireApiUser } from "@/lib/http";
import { aiNameProject, createProject } from "@/lib/projects";
import { ImportError, importWebsite } from "@/lib/site/import";

export const maxDuration = 60;

const Body = z.object({
  prompt: z.string().trim().max(4000).optional(),
  name: z.string().trim().max(60).optional(),
  /** "Redesign my existing site": import content from this URL. */
  importUrl: z.string().trim().max(500).optional(),
});

export const POST = api(async (req) => {
  const user = await requireApiUser(req);
  const body = Body.parse(await req.json());
  const profile = await getProfile(user.id);

  let source: { url: string; content: string; title: string } | undefined;
  let prompt = body.prompt;
  if (body.importUrl) {
    if (!(await rateLimit(`import:${user.id}`, 10, 3600))) throw new ApiError(429, "Too many imports this hour. Try again soon.");
    try {
      const imported = await importWebsite(body.importUrl);
      source = { url: imported.url, content: imported.dossier, title: imported.title };
    } catch (err) {
      if (err instanceof ImportError) throw new ApiError(400, err.message);
      console.error("import failed", err);
      throw new ApiError(400, "We couldn't read that website. Check the address, or describe your business instead.");
    }
    const host = new URL(source.url).hostname.replace(/^www\./, "");
    prompt = `Redesign my website (${host}) with a modern, professional look. Keep all of my real content and details${body.prompt ? `. ${body.prompt}` : "."}`;
  }

  const project = await createProject(profile, { prompt, name: body.name, source });
  if (prompt && !body.name && !source && process.env.OPENROUTER_API_KEY) {
    after(() => aiNameProject(project.id, prompt!));
  }
  return Response.json(project, { status: 201 });
});
