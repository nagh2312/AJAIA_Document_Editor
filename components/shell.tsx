import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import type { PublicUser } from "@/lib/types";

export function Shell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tight text-pine">Ajaia</span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Docs</span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="text-sm text-ink">
              <span className="font-semibold">{user.name}</span>
              <span className="ml-2 text-muted">{user.email}</span>
            </p>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
