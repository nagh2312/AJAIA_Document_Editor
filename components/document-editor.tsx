"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/extensions";
import { ShareDialog } from "@/components/share-dialog";
import type { AccessRole, DocumentDetail, ShareRecord } from "@/lib/types";

type SaveState = "saved" | "saving" | "error";

const activeMarks = {
  bold: false,
  italic: false,
  underline: false,
  h1: false,
  h2: false,
  h3: false,
  bullet: false,
  ordered: false,
};

export function DocumentEditor({ doc }: { doc: DocumentDetail }) {
  const router = useRouter();
  const canEdit = doc.access !== "viewer";
  const [title, setTitle] = useState(doc.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveState>("saved");
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [shares, setShares] = useState<ShareRecord[]>(doc.shares);
  const [shareOpen, setShareOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const lastSavedTitle = useRef(doc.title);
  const lastSavedContent = useRef(JSON.stringify(doc.content));
  const saveSeq = useRef(0);
  const contentTimer = useRef<number | null>(null);
  const titleTimer = useRef<number | null>(null);

  async function persist(body: { title?: string; content?: JSONContent }) {
    const seq = ++saveSeq.current;
    setStatus("saving");
    setStatusDetail(null);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; title?: string };
      if (seq !== saveSeq.current) return;
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) {
        setStatus("error");
        setStatusDetail(data.error ?? "Couldn't save.");
        return;
      }
      if (body.content) lastSavedContent.current = JSON.stringify(body.content);
      if (body.title) {
        lastSavedTitle.current = data.title ?? body.title;
        setTitle(lastSavedTitle.current);
      }
      setStatus("saved");
      setStatusDetail(null);
    } catch {
      if (seq !== saveSeq.current) return;
      setStatus("error");
      setStatusDetail("Couldn't save. Check your connection.");
    }
  }

  function queueContent(json: JSONContent) {
    const serialized = JSON.stringify(json);
    if (serialized === lastSavedContent.current) return;
    if (contentTimer.current) window.clearTimeout(contentTimer.current);
    setStatus("saving");
    contentTimer.current = window.setTimeout(() => {
      void persist({ content: json });
    }, 700);
  }

  function queueTitle(next: string) {
    const cleaned = next.trim();
    if (!cleaned) {
      if (titleTimer.current) window.clearTimeout(titleTimer.current);
      setTitleError("Title can't be empty.");
      return;
    }
    setTitleError(null);
    if (cleaned === lastSavedTitle.current) return;
    if (titleTimer.current) window.clearTimeout(titleTimer.current);
    setStatus("saving");
    titleTimer.current = window.setTimeout(() => {
      void persist({ title: cleaned });
    }, 500);
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: doc.content,
    editable: canEdit,
    editorProps: {
      attributes: {
        class: "tiptap",
        "aria-label": "Document body",
      },
    },
    onUpdate: ({ editor: current }) => {
      if (!canEdit) return;
      queueContent(current.getJSON());
    },
  });

  const marks =
    useEditorState({
      editor,
      selector: ({ editor: current }) => {
        if (!current) return activeMarks;
        return {
          bold: current.isActive("bold"),
          italic: current.isActive("italic"),
          underline: current.isActive("underline"),
          h1: current.isActive("heading", { level: 1 }),
          h2: current.isActive("heading", { level: 2 }),
          h3: current.isActive("heading", { level: 3 }),
          bullet: current.isActive("bulletList"),
          ordered: current.isActive("orderedList"),
        };
      },
    }) ?? activeMarks;

  useEffect(() => {
    document.title = `${title || "Untitled"} · Ajaia Docs`;
  }, [title]);

  useEffect(() => {
    return () => {
      if (contentTimer.current) window.clearTimeout(contentTimer.current);
      if (titleTimer.current) window.clearTimeout(titleTimer.current);
    };
  }, []);

  async function removeDocument() {
    if (!window.confirm("Delete this document? People you've shared it with will lose access.")) return;
    const response = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setActionError(data.error ?? "Could not delete this document.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RoleBadge access={doc.access} ownerName={doc.owner.name} />
        <div className="flex items-center gap-3">
          <SaveStatus status={status} detail={statusDetail} />
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold hover:border-pine"
          >
            Share
          </button>
          {doc.access === "owner" ? (
            <button
              type="button"
              onClick={() => void removeDocument()}
              className="rounded-full px-3 py-2 text-sm font-semibold text-danger hover:bg-danger-soft"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <input
        aria-label="Document title"
        value={title}
        disabled={!canEdit}
        onChange={(event) => {
          setTitle(event.target.value);
          queueTitle(event.target.value);
        }}
        onBlur={() => {
          if (!title.trim()) {
            setTitle(lastSavedTitle.current);
            setTitleError("Title can't be empty.");
          }
        }}
        className="w-full bg-transparent font-display text-4xl text-ink outline-none placeholder:text-muted disabled:cursor-default"
        placeholder="Untitled"
      />
      {titleError ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          {titleError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-line bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
          <ToolButton
            label="Bold"
            disabled={!canEdit || !editor}
            active={marks.bold}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            B
          </ToolButton>
          <ToolButton
            label="Italic"
            disabled={!canEdit || !editor}
            active={marks.italic}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </ToolButton>
          <ToolButton
            label="Underline"
            disabled={!canEdit || !editor}
            active={marks.underline}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-line" />
          <ToolButton
            label="Heading 1"
            disabled={!canEdit || !editor}
            active={marks.h1}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </ToolButton>
          <ToolButton
            label="Heading 2"
            disabled={!canEdit || !editor}
            active={marks.h2}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolButton>
          <ToolButton
            label="Heading 3"
            disabled={!canEdit || !editor}
            active={marks.h3}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-line" />
          <ToolButton
            label="Bullet list"
            disabled={!canEdit || !editor}
            active={marks.bullet}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            Bullets
          </ToolButton>
          <ToolButton
            label="Numbered list"
            disabled={!canEdit || !editor}
            active={marks.ordered}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            Numbers
          </ToolButton>
          {!canEdit ? <span className="ml-auto text-xs font-semibold text-muted">View only</span> : null}
        </div>
        <div className="px-8 py-6">
          <EditorContent editor={editor} />
        </div>
      </div>

      <ShareDialog
        documentId={doc.id}
        ownerName={doc.owner.name}
        access={doc.access}
        shares={shares}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onSharesChange={setShares}
      />
    </div>
  );
}

function RoleBadge({ access, ownerName }: { access: AccessRole; ownerName: string }) {
  const label = access === "owner" ? "Owner" : access === "editor" ? "Editor" : "Viewer";
  const tone =
    access === "owner"
      ? "bg-pine-soft text-pine"
      : access === "editor"
        ? "bg-clay-soft text-clay"
        : "bg-paper-2 text-muted";
  return (
    <p className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone}`}>
      {label}
      {access === "owner" ? " · you" : ` · owned by ${ownerName}`}
    </p>
  );
}

function SaveStatus({ status, detail }: { status: SaveState; detail: string | null }) {
  const label = status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Error";
  const tone = status === "error" ? "text-danger" : status === "saving" ? "text-clay" : "text-pine";
  return (
    <p className={`text-sm font-semibold ${tone}`} role="status" aria-live="polite">
      {label}
      {detail ? <span className="ml-2 font-normal">{detail}</span> : null}
    </p>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-pine text-white" : "text-ink hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}
