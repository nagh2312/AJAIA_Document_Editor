"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT = ".txt,.md,.docx";

export function LibraryActions() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function createDocument() {
    setCreating(true);
    setError(null);
    const response = await fetch("/api/documents", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
    setCreating(false);
    if (!response.ok || !data.id) {
      setError(data.error ?? "Could not create the document.");
      return;
    }
    router.push(`/documents/${data.id}`);
    router.refresh();
  }

  async function importFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "md" && ext !== "docx") {
      setError("Unsupported file. Use .txt, .md, or .docx.");
      setFileName(file.name);
      return;
    }
    setImporting(true);
    setError(null);
    setFileName(file.name);
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/documents/import", { method: "POST", body: form });
    const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
    setImporting(false);
    if (!response.ok || !data.id) {
      setError(data.error ?? "Could not import that file.");
      return;
    }
    router.push(`/documents/${data.id}`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Import a file</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Supported types: <span className="font-semibold text-ink">.txt</span>,{" "}
            <span className="font-semibold text-ink">.md</span>, and{" "}
            <span className="font-semibold text-ink">.docx</span>. Other files are rejected.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            aria-label="Choose a .txt, .md, or .docx file"
            className="max-w-56 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => void createDocument()}
            disabled={creating}
            className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-[#a3411d] disabled:opacity-60"
          >
            {creating ? "Creating…" : "New document"}
          </button>
        </div>
      </div>
      {importing ? <p className="mt-3 text-sm text-pine">Importing {fileName}…</p> : null}
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
