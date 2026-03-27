import Link from "next/link";

import { logoutAction } from "@/app/_actions/auth";
import { requireSubscriber } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSubscriber();

  return (
    <div className="min-h-screen bg-[var(--color-sand)]">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
              Subscriber workspace
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
              Welcome back, {user.name}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-muted)]">
            <Link href="/" className="rounded-full border border-black/10 px-4 py-2 transition hover:border-[var(--color-moss)] hover:text-[var(--color-ink)]">
              Public site
            </Link>
            <form action={logoutAction}>
              <button className="ui-solid-action rounded-full bg-[var(--color-ink)] px-4 py-2 text-white transition hover:bg-[var(--color-moss)]">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">{children}</main>
    </div>
  );
}


