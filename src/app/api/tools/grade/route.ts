import { z } from "zod";
import { api, ApiError, clientIp, rateLimit } from "@/lib/http";
import { gradeWebsite } from "@/lib/site/grade";
import { ImportError } from "@/lib/site/import";

export const maxDuration = 30;

const Body = z.object({ url: z.string().trim().min(4, "Enter a website address.").max(500) });

/** Public (no sign-in): the free website grader. Rate limited per IP. */
export const POST = api(async (req) => {
  const { url } = Body.parse(await req.json());
  if (!(await rateLimit(`grade:${clientIp(req)}`, 15, 3600))) throw new ApiError(429, "You've graded a lot of sites this hour. Try again later.");
  try {
    return Response.json(await gradeWebsite(url));
  } catch (err) {
    if (err instanceof ImportError) throw new ApiError(400, err.message);
    console.error("grade failed", err);
    throw new ApiError(400, "We couldn't check that site. Make sure the address is right and the site is public.");
  }
});
