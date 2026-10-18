import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { requireEdit, requireOwner, requireRead } from "@/lib/access";
import { assertDoc, contentFromUpload, emptyDoc, parseStoredContent } from "@/lib/content";
import type { DocumentDetail, DocumentSummary, ShareRecord, ShareRole } from "@/lib/types";

const userSelect = { id: true, name: true, email: true } as const;

function asShareRole(role: string): ShareRole {
  return role === "viewer" ? "viewer" : "editor";
}

export async function loginWithPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    throw new AppError(400, "Enter your email and password.");
  }
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Email or password doesn't match.");
  }
  return { id: user.id, name: user.name, email: user.email };
}

export async function listDocuments(userId: string): Promise<{
  owned: DocumentSummary[];
  shared: DocumentSummary[];
}> {
  const [owned, shares] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { shares: true } } },
    }),
    prisma.share.findMany({
      where: { userId },
      include: {
        document: {
          include: { owner: { select: userSelect } },
        },
      },
    }),
  ]);

  const shared = shares
    .slice()
    .sort((a, b) => b.document.updatedAt.getTime() - a.document.updatedAt.getTime())
    .map((share) => ({
      id: share.document.id,
      title: share.document.title,
      updatedAt: share.document.updatedAt.toISOString(),
      role: asShareRole(share.role),
      ownerName: share.document.owner.name,
    }));

  return {
    owned: owned.map((doc) => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt.toISOString(),
      role: "owner" as const,
      shareCount: doc._count.shares,
    })),
    shared,
  };
}

export async function createDocument(userId: string, title = "Untitled") {
  const cleaned = title.trim() || "Untitled";
  const doc = await prisma.document.create({
    data: {
      title: cleaned.slice(0, 200),
      content: JSON.stringify(emptyDoc()),
      ownerId: userId,
    },
  });
  return { id: doc.id, title: doc.title };
}

export async function getDocument(userId: string, documentId: string): Promise<DocumentDetail> {
  const access = await requireRead(userId, documentId);
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: userSelect },
      shares: {
        include: { user: { select: userSelect } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!doc) throw new AppError(404, "Document not found.");
  return {
    id: doc.id,
    title: doc.title,
    content: parseStoredContent(doc.content),
    updatedAt: doc.updatedAt.toISOString(),
    access,
    owner: doc.owner,
    shares: doc.shares.map(toShareRecord),
  };
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: { title?: string; content?: unknown },
) {
  await requireEdit(userId, documentId);
  const data: { title?: string; content?: string } = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new AppError(400, "Title can't be empty.");
    if (title.length > 200) throw new AppError(400, "Title must be 200 characters or fewer.");
    data.title = title;
  }

  if (input.content !== undefined) {
    data.content = JSON.stringify(assertDoc(input.content));
  }

  if (!data.title && !data.content) {
    throw new AppError(400, "Nothing to update.");
  }

  const doc = await prisma.document.update({
    where: { id: documentId },
    data,
  });
  return { id: doc.id, title: doc.title, updatedAt: doc.updatedAt.toISOString() };
}

export async function deleteDocument(userId: string, documentId: string) {
  await requireOwner(userId, documentId);
  await prisma.document.delete({ where: { id: documentId } });
}

export async function shareDocument(
  actorId: string,
  documentId: string,
  email: string,
  role: ShareRole = "editor",
): Promise<ShareRecord> {
  await requireOwner(actorId, documentId);
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new AppError(400, "Enter an email address.");

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor) throw new AppError(401, "You need to sign in.");
  if (actor.email.toLowerCase() === normalized) {
    throw new AppError(400, "You already own this document.");
  }

  const recipient = await prisma.user.findUnique({ where: { email: normalized } });
  if (!recipient) {
    throw new AppError(400, "No account found for that email. Only existing Ajaia Docs users can be added.");
  }

  const doc = await prisma.document.findUnique({ where: { id: documentId }, select: { ownerId: true } });
  if (doc?.ownerId === recipient.id) {
    throw new AppError(400, "That person already owns this document.");
  }

  const share = await prisma.share.upsert({
    where: { documentId_userId: { documentId, userId: recipient.id } },
    update: { role },
    create: { documentId, userId: recipient.id, role },
    include: { user: { select: userSelect } },
  });
  return toShareRecord(share);
}

export async function removeShare(actorId: string, documentId: string, shareUserId: string) {
  await requireOwner(actorId, documentId);
  const existing = await prisma.share.findUnique({
    where: { documentId_userId: { documentId, userId: shareUserId } },
  });
  if (!existing) throw new AppError(404, "That person does not have access.");
  await prisma.share.delete({ where: { id: existing.id } });
}

export async function importDocument(userId: string, filename: string, bytes: Buffer) {
  const imported = await contentFromUpload(filename, bytes);
  const doc = await prisma.document.create({
    data: {
      title: imported.title,
      content: JSON.stringify(imported.content),
      ownerId: userId,
    },
  });
  return { id: doc.id, title: doc.title };
}

function toShareRecord(share: {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}): ShareRecord {
  return {
    id: share.id,
    role: asShareRole(share.role),
    user: share.user,
  };
}
