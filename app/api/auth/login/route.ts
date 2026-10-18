import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword } from "@/lib/documents";
import { createSession, setSessionCookie } from "@/lib/session";
import { jsonError } from "@/lib/http";
import { AppError } from "@/lib/errors";

const LoginBody = z.object({
  email: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const parsed = LoginBody.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError(400, "Enter your email and password.");
    const user = await loginWithPassword(parsed.data.email, parsed.data.password);
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
