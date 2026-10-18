import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { AccessRole } from "@/lib/types";

type Lookup = "missing" | "none" | AccessRole;

export async function getAccess(userId: string, documentId: string): Promise<Lookup> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ownerId: true,
      shares: { where: { userId }, select: { role: true }, take: 1 },
    },
  });
  if (!doc) return "missing";
  if (doc.ownerId === userId) return "owner";
  const role = doc.shares[0]?.role;
  if (!role) return "none";
  return role === "editor" ? "editor" : "viewer";
}

export async function requireRead(userId: string, documentId: string): Promise<AccessRole> {
  const access = await getAccess(userId, documentId);
  if (access === "missing") throw new AppError(404, "Document not found.");
  if (access === "none") throw new AppError(403, "You do not have access to this document.");
  return access;
}

export async function requireEdit(userId: string, documentId: string): Promise<AccessRole> {
  const access = await requireRead(userId, documentId);
  if (access === "viewer") {
    throw new AppError(403, "You have view-only access and cannot edit this document.");
  }
  return access;
}

export async function requireOwner(userId: string, documentId: string): Promise<AccessRole> {
  const access = await requireRead(userId, documentId);
  if (access !== "owner") {
    throw new AppError(403, "Only the owner can change sharing or delete this document.");
  }
  return access;
}
