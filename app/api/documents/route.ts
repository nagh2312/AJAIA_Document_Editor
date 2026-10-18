import { NextResponse } from "next/server";
import { createDocument, listDocuments } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const documents = await listDocuments(user.id);
    return NextResponse.json(documents);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const doc = await createDocument(user.id);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
