import { redirect } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor";
import { Shell } from "@/components/shell";
import { AppError } from "@/lib/errors";
import { getDocument } from "@/lib/documents";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  try {
    const doc = await getDocument(user.id, id);
    return (
      <Shell user={user}>
        <DocumentEditor doc={doc} />
      </Shell>
    );
  } catch (error) {
    if (error instanceof AppError && (error.status === 403 || error.status === 404)) {
      return (
        <Shell user={user}>
          <main className="mx-auto max-w-lg px-6 py-20">
            <div className="rounded-2xl border border-line bg-card p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-danger">
                {error.status === 403 ? "No access" : "Not found"}
              </p>
              <h1 className="mt-2 font-display text-3xl">{error.message}</h1>
              <p className="mt-2 text-sm text-muted">The document contents stay hidden.</p>
              <Link href="/" className="mt-6 inline-block text-sm font-semibold text-pine hover:underline">
                Back to documents
              </Link>
            </div>
          </main>
        </Shell>
      );
    }
    throw error;
  }
}
