import { after } from "next/server";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { api, requireApiUser } from "@/lib/http";
import { aiNameProject, createProject } from "@/lib/projects";

const Body = z.object({
  prompt: z.string().trim().max(4000).optional(),
  name: z.string().trim().max(60).optional(),
});

export const POST = api(async (req) => {
  const user = await requireApiUser(req);
  const body = Body.parse(await req.json());
  const profile = await getProfile(user.id);
  const project = await createProject(profile, body);
  if (body.prompt && !body.name && process.env.OPENROUTER_API_KEY) {
    after(() => aiNameProject(project.id, body.prompt!));
  }
  return Response.json(project, { status: 201 });
});
