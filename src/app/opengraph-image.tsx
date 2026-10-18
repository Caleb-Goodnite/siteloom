import { ogCard, OG_SIZE } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Curblit — websites that get found";

export default function Image() {
  return ogCard({ title: "Websites that get found.", eyebrow: "The AI website builder for businesses" });
}
