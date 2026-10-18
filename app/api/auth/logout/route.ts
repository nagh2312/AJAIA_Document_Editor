import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/session";
import { jsonError } from "@/lib/http";

export async function POST() {
  try {
    await destroyCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
