import type { JSONContent } from "@tiptap/core";
import mammoth from "mammoth";
import { generateJSON } from "@tiptap/html/server";
import { AppError } from "@/lib/errors";
import { editorExtensions } from "@/lib/extensions";

const MAX_CONTENT_CHARS = 1_000_000;

export function emptyDoc(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function assertDoc(value: unknown): JSONContent {
  if (!value || typeof value !== "object") {
    throw new AppError(400, "Document content is invalid.");
  }
  const record = value as { type?: unknown; content?: unknown };
  if (record.type !== "doc") {
    throw new AppError(400, "Document content is invalid.");
  }
  if (record.content !== undefined && !Array.isArray(record.content)) {
    throw new AppError(400, "Document content is invalid.");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_CONTENT_CHARS) {
    throw new AppError(400, "Document is too large to save.");
  }
  return value as JSONContent;
}

export function parseStoredContent(raw: string): JSONContent {
  try {
    return assertDoc(JSON.parse(raw));
  } catch (error) {
    if (error instanceof AppError && error.status === 400 && error.message.includes("too large")) {
      throw error;
    }
    return emptyDoc();
  }
}

function textNode(text: string, mark?: "bold" | "italic"): JSONContent {
  const node: JSONContent = { type: "text", text };
  if (mark) node.marks = [{ type: mark }];
  return node;
}

function parseInline(input: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  const pattern = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*/g;
  let last = 0;
  for (const match of input.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(textNode(input.slice(last, index)));
    if (match[1] !== undefined) nodes.push(textNode(match[1], "bold"));
    else if (match[2] !== undefined) nodes.push(textNode(match[2], "bold"));
    else if (match[3] !== undefined) nodes.push(textNode(match[3], "italic"));
    last = index + match[0].length;
  }
  if (last < input.length) nodes.push(textNode(input.slice(last)));
  return nodes.filter((node) => node.text);
}

function paragraphFrom(text: string, inline: boolean): JSONContent {
  const content = inline ? parseInline(text) : text ? [textNode(text)] : [];
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

function headingFrom(level: 1 | 2 | 3, text: string): JSONContent {
  const content = parseInline(text);
  return content.length
    ? { type: "heading", attrs: { level }, content }
    : { type: "heading", attrs: { level } };
}

export function textToDoc(text: string): JSONContent {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const content = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => paragraphFrom(line, false));
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export function markdownToDoc(markdown: string): JSONContent {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const content: JSONContent[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      content.push(headingFrom(level, heading[2].trim()));
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: JSONContent[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const itemText = lines[index].replace(/^\s*[-*]\s+/, "").trim();
        items.push({ type: "listItem", content: [paragraphFrom(itemText, true)] });
        index += 1;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: JSONContent[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const itemText = lines[index].replace(/^\s*\d+\.\s+/, "").trim();
        items.push({ type: "listItem", content: [paragraphFrom(itemText, true)] });
        index += 1;
      }
      content.push({ type: "orderedList", attrs: { start: 1 }, content: items });
      continue;
    }

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const buffer = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      buffer.push(lines[index].trim());
      index += 1;
    }
    content.push(paragraphFrom(buffer.join(" "), true));
  }

  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function titleFromFilename(filename: string) {
  const base = filename.replace(/^.*[/\\]/, "").trim();
  const title = base
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001f]/g, "")
    .trim();
  return (title || "Imported document").slice(0, 200);
}

function extensionOf(filename: string) {
  const base = filename.replace(/^.*[/\\]/, "").trim().toLowerCase();
  const parts = base.split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

export async function contentFromUpload(filename: string, bytes: Buffer) {
  const ext = extensionOf(filename);
  const title = titleFromFilename(filename);
  if (ext === "txt") {
    return { title, content: textToDoc(bytes.toString("utf8")) };
  }
  if (ext === "md") {
    return { title, content: markdownToDoc(bytes.toString("utf8")) };
  }
  if (ext === "docx") {
    return { title, content: await docxToDoc(bytes) };
  }
  throw new AppError(400, "Unsupported file. Use .txt, .md, or .docx.");
}

async function docxToDoc(bytes: Buffer): Promise<JSONContent> {
  let html = "";
  try {
    const result = await mammoth.convertToHtml({ buffer: bytes });
    html = result.value
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .trim();
  } catch {
    throw new AppError(400, "Could not read that Word document. Check that it is a valid .docx file.");
  }

  if (!html) return emptyDoc();

  try {
    const json = generateJSON(html, editorExtensions);
    return assertDoc(json);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, "Could not read that Word document. Check that it is a valid .docx file.");
  }
}
