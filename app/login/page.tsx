import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pine">Ajaia LLC</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight text-ink">Ajaia Docs</h1>
        <p className="mt-2 mb-6 text-muted">Sign in to write, import, and share documents.</p>
        <LoginForm />
      </div>
    </main>
  );
}
