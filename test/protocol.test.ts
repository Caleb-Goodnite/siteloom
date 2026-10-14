import { describe, expect, it } from "vitest";
import { applyOps, findBlock, listPages, parseResponse, sanitizePath } from "@/lib/ai/protocol";

describe("parseResponse", () => {
  it("separates prose from file operations", () => {
    const raw = `I'll build a calm site.

<sl-file path="index.html">
<!doctype html><h1>Hi</h1>
</sl-file>

<sl-edit path="partials/footer.html">
<<<<<<< SEARCH
<p>Old</p>
=======
<p>New</p>
>>>>>>> REPLACE
</sl-edit>

<sl-delete path="old.html" />

- Added a home page`;
    const p = parseResponse(raw);
    expect(p.ops.map((o) => [o.kind, o.path, o.complete])).toEqual([
      ["file", "index.html", true],
      ["edit", "partials/footer.html", true],
      ["delete", "old.html", true],
    ]);
    expect(p.ops[0].kind === "file" && p.ops[0].content).toBe("<!doctype html><h1>Hi</h1>");
    expect(p.ops[1].kind === "edit" && p.ops[1].blocks).toEqual([{ search: "<p>Old</p>", replace: "<p>New</p>" }]);
    expect(p.text).toContain("I'll build a calm site.");
    expect(p.text).toContain("Added a home page");
    expect(p.text).not.toContain("sl-");
  });

  it("handles a file that is still streaming and hides partial tags", () => {
    const p = parseResponse(`Working on it.\n<sl-file path="about.html">\n<html><body><h1>Ab`);
    expect(p.ops).toHaveLength(1);
    expect(p.ops[0]).toMatchObject({ kind: "file", path: "about.html", complete: false });
    expect(p.ops[0].kind === "file" && p.ops[0].content).toBe("<html><body><h1>Ab");

    const partial = parseResponse(`Planning…\n<sl-fi`);
    expect(partial.ops).toHaveLength(0);
    expect(partial.text).toBe("Planning…");
  });

  it("strips markdown fences inside a file block", () => {
    const p = parseResponse('<sl-file path="assets/site.js">\n```js\nconsole.log(1)\n```\n</sl-file>');
    expect(p.ops[0].kind === "file" && p.ops[0].content).toBe("console.log(1)");
  });

  it("supports empty replacements and multiple blocks", () => {
    const p = parseResponse(`<sl-edit path="a.html">
<<<<<<< SEARCH
<b>x</b>
=======
>>>>>>> REPLACE
<<<<<<< SEARCH
<i>y</i>
=======
<i>z</i>
>>>>>>> REPLACE
</sl-edit>`);
    expect(p.ops[0].kind === "edit" && p.ops[0].blocks).toEqual([
      { search: "<b>x</b>", replace: "" },
      { search: "<i>y</i>", replace: "<i>z</i>" },
    ]);
  });

  it("drops unsafe paths", () => {
    const p = parseResponse(`<sl-file path="../../etc/passwd.html">x</sl-file><sl-file path="ok.html">y</sl-file>`);
    expect(p.ops.map((o) => o.path)).toEqual(["ok.html"]);
  });
});

describe("sanitizePath", () => {
  it.each([
    ["index.html", "index.html"],
    ["./about.html", "about.html"],
    ["/partials/head.html", "partials/head.html"],
    ["assets/site.js", "assets/site.js"],
    ["../x.html", null],
    ["a/../b.html", null],
    ["evil.php", null],
    ["spaces here.html", null],
  ])("%s → %s", (input, out) => expect(sanitizePath(input)).toBe(out));
});

describe("applyOps", () => {
  const files = { "index.html": "<main>\n    <h1>Hello</h1>\n    <p>World</p>\n</main>", "old.html": "x" };

  it("applies exact and indentation-insensitive edits", () => {
    const ops = parseResponse(`<sl-edit path="index.html">
<<<<<<< SEARCH
<h1>Hello</h1>
<p>World</p>
=======
    <h1>Hi there</h1>
    <p>Planet</p>
>>>>>>> REPLACE
</sl-edit><sl-delete path="old.html"/>`).ops;
    const r = applyOps(files, ops);
    expect(r.failures).toEqual([]);
    expect(r.files["index.html"]).toBe("<main>\n    <h1>Hi there</h1>\n    <p>Planet</p>\n</main>");
    expect(r.files["old.html"]).toBeUndefined();
    expect(r.changed.sort()).toEqual(["index.html", "old.html"]);
  });

  it("reports edits that don't match instead of corrupting files", () => {
    const ops = parseResponse(`<sl-edit path="index.html">
<<<<<<< SEARCH
<h2>Nope</h2>
=======
<h2>Yes</h2>
>>>>>>> REPLACE
</sl-edit>`).ops;
    const r = applyOps(files, ops);
    expect(r.files["index.html"]).toBe(files["index.html"]);
    expect(r.failures[0]).toMatchObject({ path: "index.html", reason: "search text not found" });
  });

  it("never deletes the home page and never applies half an edit", () => {
    const ops = parseResponse(`<sl-delete path="index.html"/><sl-edit path="index.html">
<<<<<<< SEARCH
<h1>Hello</h1>
=======
<h1>X`).ops;
    const r = applyOps(files, ops, { includeIncomplete: true });
    expect(r.files["index.html"]).toBe(files["index.html"]);
  });

  it("findBlock returns null for empty search", () => {
    expect(findBlock("abc", "  \n ")).toBeNull();
  });
});

describe("listPages", () => {
  it("lists top-level html pages with index first", () => {
    expect(listPages({ "b.html": "", "index.html": "", "partials/h.html": "", "assets/a.js": "", "a.html": "" })).toEqual(["index.html", "a.html", "b.html"]);
  });
});
