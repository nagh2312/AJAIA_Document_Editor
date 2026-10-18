import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { contentFromUpload, markdownToDoc, textToDoc } from "@/lib/content";

describe("file import", () => {
  it("turns markdown headings and lists into editor blocks and leaves plain text literal", async () => {
    const markdown = await contentFromUpload(
      "notes.md",
      Buffer.from("# Title\n\n**Bold** and *italic*\n\n- one\n- two\n\n1. first\n"),
    );
    expect(markdown.title).toBe("notes");
    expect(markdown.content.content?.[0]).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect(JSON.stringify(markdown.content)).toContain("bold");
    expect(JSON.stringify(markdown.content)).toContain("bulletList");
    expect(JSON.stringify(markdown.content)).toContain("orderedList");

    const plain = textToDoc("Keep **stars** literal");
    expect(JSON.stringify(plain)).toContain("**stars**");
    expect(JSON.stringify(plain)).not.toContain('"type":"bold"');

    const fromMarkdown = markdownToDoc("## Section");
    expect(fromMarkdown.content?.[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
  });

  it("rejects unsupported file types", async () => {
    await expect(contentFromUpload("slides.pdf", Buffer.from("nope"))).rejects.toMatchObject({
      status: 400,
    } satisfies Partial<AppError>);
  });
});
