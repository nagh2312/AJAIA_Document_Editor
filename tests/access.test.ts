import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-constants";

const auth = { token: "" };

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name !== SESSION_COOKIE || !auth.token) return undefined;
      return { name, value: auth.token };
    },
    set: () => undefined,
    delete: () => undefined,
  }),
}));

const SECRET = "SECRET_PHRASE_ONLY_IN_DOC";

async function asUser<T>(token: string, run: () => Promise<T>) {
  auth.token = token;
  try {
    return await run();
  } finally {
    auth.token = "";
  }
}

describe("sharing access control", () => {
  let passwordHash = "";

  beforeEach(async () => {
    passwordHash = passwordHash || (await bcrypt.hash("demo123", 10));
    await prisma.share.deleteMany();
    await prisma.session.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  it("stops viewers from mutating and non-members from reading", async () => {
    const { GET, PATCH, DELETE } = await import("@/app/api/documents/[id]/route");
    const { POST: share } = await import("@/app/api/documents/[id]/shares/route");

    const owner = await prisma.user.create({
      data: { email: "nagashree@ajaia.local", name: "Nagashree", passwordHash },
    });
    const alex = await prisma.user.create({
      data: { email: "alex@ajaia.local", name: "Alex", passwordHash },
    });
    const stranger = await prisma.user.create({
      data: { email: "sam@ajaia.local", name: "Sam", passwordHash },
    });
    const doc = await prisma.document.create({
      data: {
        title: "Access control notes",
        ownerId: owner.id,
        content: JSON.stringify({
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: SECRET }] }],
        }),
      },
    });

    const ownerToken = await createSession(owner.id);
    const alexToken = await createSession(alex.id);
    const strangerToken = await createSession(stranger.id);

    const strangerRead = await asUser(strangerToken, () =>
      GET(new Request("http://local/api"), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(strangerRead.status).toBe(403);
    const strangerBody = await strangerRead.text();
    expect(strangerBody).not.toContain(SECRET);

    const strangerWrite = await asUser(strangerToken, () =>
      PATCH(jsonRequest({ title: "Stolen" }), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(strangerWrite.status).toBe(403);

    const shared = await asUser(ownerToken, () =>
      share(jsonRequest({ email: alex.email, role: "viewer" }), {
        params: Promise.resolve({ id: doc.id }),
      }),
    );
    expect(shared.status).toBe(201);

    const viewerRead = await asUser(alexToken, () =>
      GET(new Request("http://local/api"), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(viewerRead.status).toBe(200);
    expect(await viewerRead.text()).toContain(SECRET);

    const viewerWrite = await asUser(alexToken, () =>
      PATCH(
        jsonRequest({
          content: {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "hacked" }] }],
          },
        }),
        { params: Promise.resolve({ id: doc.id }) },
      ),
    );
    expect(viewerWrite.status).toBe(403);
    const stored = await prisma.document.findUniqueOrThrow({ where: { id: doc.id } });
    expect(stored.content).toContain(SECRET);
    expect(stored.content).not.toContain("hacked");

    const viewerDelete = await asUser(alexToken, () =>
      DELETE(new Request("http://local/api"), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(viewerDelete.status).toBe(403);

    const viewerShare = await asUser(alexToken, () =>
      share(jsonRequest({ email: stranger.email, role: "editor" }), {
        params: Promise.resolve({ id: doc.id }),
      }),
    );
    expect(viewerShare.status).toBe(403);
    expect(await prisma.share.count({ where: { documentId: doc.id, userId: stranger.id } })).toBe(0);

    const selfShare = await asUser(ownerToken, () =>
      share(jsonRequest({ email: owner.email }), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(selfShare.status).toBe(400);

    const unknownShare = await asUser(ownerToken, () =>
      share(jsonRequest({ email: "missing@ajaia.local" }), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(unknownShare.status).toBe(400);
  });

  it("lets an editor change the document but not delete or re-share it", async () => {
    const { PATCH, DELETE } = await import("@/app/api/documents/[id]/route");
    const { POST: share } = await import("@/app/api/documents/[id]/shares/route");

    const owner = await prisma.user.create({
      data: { email: "nagashree@ajaia.local", name: "Nagashree", passwordHash },
    });
    const alex = await prisma.user.create({
      data: { email: "alex@ajaia.local", name: "Alex", passwordHash },
    });
    const doc = await prisma.document.create({
      data: {
        title: "Draft",
        ownerId: owner.id,
        content: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
      },
    });
    await prisma.share.create({ data: { documentId: doc.id, userId: alex.id, role: "editor" } });
    const alexToken = await createSession(alex.id);

    const edit = await asUser(alexToken, () =>
      PATCH(jsonRequest({ title: "Draft from Alex" }), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(edit.status).toBe(200);
    const stored = await prisma.document.findUniqueOrThrow({ where: { id: doc.id } });
    expect(stored.title).toBe("Draft from Alex");

    const remove = await asUser(alexToken, () =>
      DELETE(new Request("http://local/api"), { params: Promise.resolve({ id: doc.id }) }),
    );
    expect(remove.status).toBe(403);

    const reshare = await asUser(alexToken, () =>
      share(jsonRequest({ email: "sam@ajaia.local", role: "viewer" }), {
        params: Promise.resolve({ id: doc.id }),
      }),
    );
    expect(reshare.status).toBe(403);
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://local/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
