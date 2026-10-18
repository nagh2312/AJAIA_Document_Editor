import { NextResponse } from "next/server";
import { importDocument } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { jsonError } from "@/lib/http";
import { AppError } from "@/lib/errors";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError(400, "Choose a .txt, .md, or .docx file.");
    if (!file.name) throw new AppError(400, "Choose a .txt, .md, or .docx file.");
    if (file.size > MAX_BYTES) throw new AppError(400, "Files must be 5 MB or smaller.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const doc = await importDocument(user.id, file.name, bytes);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
