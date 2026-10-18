import Link from "next/link";
import { redirect } from "next/navigation";
import { LibraryActions } from "@/components/library-actions";
import { Shell } from "@/components/shell";
import { listDocuments } from "@/lib/documents";
import { getCurrentUser } from "@/lib/session";
import type { DocumentSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocuments(user.id);

  return (
    <Shell user={user}>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="font-display text-4xl tracking-tight">Documents</h1>
          <p className="mt-1 text-muted">Owned by you and shared with you stay in separate lists.</p>
        </div>
        <LibraryActions />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <DocumentColumn
            title="Owned by me"
            empty="No documents yet. Create one or import a .txt, .md, or .docx file."
            documents={owned}
          />
          <DocumentColumn
            title="Shared with me"
            empty="Nothing has been shared with you."
            documents={shared}
          />
        </div>
      </main>
    </Shell>
  );
}

function DocumentColumn({
  title,
  empty,
  documents,
}: {
  title: string;
  empty: string;
  documents: DocumentSummary[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-card/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="text-sm text-muted">{documents.length}</span>
      </div>
      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className={`block rounded-xl border border-line bg-card px-4 py-3 hover:border-pine ${
                  doc.role === "owner" ? "border-l-4 border-l-pine" : "border-l-4 border-l-clay"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{doc.title}</h3>
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                    {doc.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Updated {formatWhen(doc.updatedAt)}
                  {doc.role === "owner" && doc.shareCount
                    ? ` · shared with ${doc.shareCount}`
                    : doc.ownerName
                      ? ` · from ${doc.ownerName}`
                      : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}
