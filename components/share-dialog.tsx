"use client";

import { useEffect, useRef, useState } from "react";
import type { AccessRole, ShareRecord, ShareRole } from "@/lib/types";

export function ShareDialog({
  documentId,
  ownerName,
  access,
  shares,
  open,
  onClose,
  onSharesChange,
}: {
  documentId: string;
  ownerName: string;
  access: AccessRole;
  shares: ShareRecord[];
  open: boolean;
  onClose: () => void;
  onSharesChange: (shares: ShareRecord[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const canManage = access === "owner";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function addShare(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/documents/${documentId}/shares`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = (await response.json().catch(() => ({}))) as ShareRecord & { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not share this document.");
      return;
    }
    const next = shares.filter((share) => share.user.id !== data.user.id);
    onSharesChange([...next, { id: data.id, role: data.role, user: data.user }]);
    setEmail("");
    setRole("editor");
  }

  async function updateRole(share: ShareRecord, nextRole: ShareRole) {
    setError(null);
    const response = await fetch(`/api/documents/${documentId}/shares`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: share.user.email, role: nextRole }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not change that role.");
      return;
    }
    onSharesChange(shares.map((item) => (item.id === share.id ? { ...item, role: nextRole } : item)));
  }

  async function remove(share: ShareRecord) {
    setError(null);
    const response = await fetch(`/api/documents/${documentId}/shares/${share.user.id}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not remove access.");
      return;
    }
    onSharesChange(shares.filter((item) => item.id !== share.id));
  }

  return (
    <dialog
      ref={dialogRef}
      className="share-dialog"
      aria-labelledby="share-title"
      onClose={onClose}
    >
      <div className="rounded-2xl border border-line bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="font-display text-2xl">
              Share
            </h2>
            <p className="mt-1 text-sm text-muted">
              {ownerName} owns this document. New people start as editors unless you choose viewer.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-ink">
            Close
          </button>
        </div>

        {canManage ? (
          <form onSubmit={addShare} className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alex@ajaia.local"
              aria-label="Email to share with"
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <select
              aria-label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value as ShareRole)}
              className="rounded-lg border border-line bg-white px-2 py-2 text-sm"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add"}
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-sm text-muted">
            Only the owner can share this document or remove people.
          </p>
        )}

        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <ul className="mt-4 divide-y divide-line border-t border-line">
          <li className="flex items-center justify-between py-3 text-sm">
            <span>
              <span className="font-semibold">{ownerName}</span>
              <span className="ml-2 text-muted">Owner</span>
            </span>
          </li>
          {shares.length === 0 ? (
            <li className="py-3 text-sm text-muted">No one else has access yet.</li>
          ) : (
            shares.map((share) => (
              <li key={share.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="font-semibold">{share.user.name}</span>
                  <span className="ml-2 text-muted">{share.user.email}</span>
                </span>
                {canManage ? (
                  <span className="flex items-center gap-2">
                    <select
                      aria-label={`Role for ${share.user.name}`}
                      value={share.role}
                      onChange={(event) => void updateRole(share, event.target.value as ShareRole)}
                      className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void remove(share)}
                      className="text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </span>
                ) : (
                  <span className="text-muted capitalize">{share.role}</span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </dialog>
  );
}
