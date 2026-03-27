import Link from "next/link";
import type { ReactNode } from "react";

import { appConfig } from "@/lib/config";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top,_rgba(77,143,110,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(252,181,75,0.35),_transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute left-[-8rem] top-[28rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(243,114,100,0.2),_transparent_70%)] blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-white/50 bg-[rgba(247,244,238,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
              {appConfig.appName}
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
              Charity-led golf that feels alive.
            </p>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-muted)] md:flex">
            <Link href="/how-it-works" className="transition hover:text-[var(--color-ink)]">
              How it works
            </Link>
            <Link href="/charities" className="transition hover:text-[var(--color-ink)]">
              Charities
            </Link>
            <Link href="/login" className="transition hover:text-[var(--color-ink)]">
              Login
            </Link>
            <Link
              href="/signup"
              className="ui-solid-action rounded-full bg-[var(--color-ink)] px-4 py-2 text-white transition hover:bg-[var(--color-moss)]"
            >
              Join now
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/50 bg-white/70 backdrop-blur">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-10 text-sm text-[var(--color-muted)] lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
              Performance, generosity, and a monthly reason to come back.
            </p>
            <p>
              A modern subscription platform inspired by the PRD: score-led participation, monthly draw mechanics, and visible charity impact.
            </p>
          </div>
          <div className="space-y-3">
            <p className="font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
              Explore
            </p>
            <Link href="/charities" className="block hover:text-[var(--color-ink)]">
              Charity directory
            </Link>
            <Link href="/how-it-works" className="block hover:text-[var(--color-ink)]">
              Platform mechanics
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
              Access
            </p>
            <Link href="/login" className="block hover:text-[var(--color-ink)]">
              Subscriber login
            </Link>
            <Link href="/admin" className="block hover:text-[var(--color-ink)]">
              Admin panel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


