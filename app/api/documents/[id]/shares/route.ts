import { NextResponse } from "next/server";
import { z } from "zod";
import { shareDocument } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { jsonError } from "@/lib/http";
import { AppError } from "@/lib/errors";

const ShareBody = z.object({
  email: z.string(),
  role: z.enum(["editor", "viewer"]).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = ShareBody.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError(400, "Enter an email address.");
    const share = await shareDocument(user.id, id, parsed.data.email, parsed.data.role ?? "editor");
    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
