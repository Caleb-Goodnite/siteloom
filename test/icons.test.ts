import { describe, expect, it } from "vitest";
import { inlineIcons } from "@/lib/site/icons";

describe("inlineIcons", () => {
  it("keeps Alpine attributes so menu icons toggle", () => {
    const html = inlineIcons(`<i data-lucide="menu" class="size-6" x-show="!open"></i><i data-lucide="x" class="size-6" x-show="open" x-cloak></i>`);
    expect(html).toContain('class="lucide lucide-menu size-6" aria-hidden="true" x-show="!open">');
    expect(html).toContain('class="lucide lucide-x size-6" aria-hidden="true" x-show="open" x-cloak>');
    expect(html).not.toContain("data-lucide");
  });
});
