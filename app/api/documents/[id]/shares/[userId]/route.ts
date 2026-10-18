import { NextResponse } from "next/server";
import { removeShare } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { jsonError } from "@/lib/http";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id, userId } = await context.params;
    await removeShare(user.id, id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
