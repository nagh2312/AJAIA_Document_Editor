"use client";

export function SignOutButton() {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-ink hover:text-ink"
    >
      Sign out
    </button>
  );
}
