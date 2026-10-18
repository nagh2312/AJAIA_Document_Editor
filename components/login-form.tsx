"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/demo-accounts";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(DEMO_USERS[0].email);
  const [password, setPassword] = useState<string>(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
        <label className="block text-sm font-semibold" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
          required
        />
        <label className="mt-4 block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
          required
        />
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-pine px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16382b] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-4 rounded-2xl border border-dashed border-line bg-card/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Seeded accounts</p>
        <ul className="mt-3 space-y-2">
          {DEMO_USERS.map((user) => (
            <li key={user.email} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-sm text-muted">
                  {user.email} · {DEMO_PASSWORD}
                </p>
                <p className="text-xs text-muted">{user.note}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-pine hover:text-pine"
                onClick={() => {
                  setEmail(user.email);
                  setPassword(DEMO_PASSWORD);
                  setError(null);
                }}
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
