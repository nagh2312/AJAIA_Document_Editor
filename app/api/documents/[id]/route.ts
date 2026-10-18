import { NextResponse } from "next/server";
import { deleteDocument, getDocument, updateDocument } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { jsonError } from "@/lib/http";
import { AppError } from "@/lib/errors";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const doc = await getDocument(user.id, id);
    return NextResponse.json(doc);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { title?: unknown; content?: unknown } | null;
    if (!body || typeof body !== "object") throw new AppError(400, "Nothing to update.");
    const title = typeof body.title === "string" ? body.title : undefined;
    if (body.title !== undefined && typeof body.title !== "string") {
      throw new AppError(400, "Title can't be empty.");
    }
    const doc = await updateDocument(user.id, id, { title, content: body.content });
    return NextResponse.json(doc);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await deleteDocument(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
