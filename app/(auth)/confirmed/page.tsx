import Link from "next/link";

import { PublicShell } from "@/components/site/public-shell";
import { Card, Notice } from "@/components/ui";

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <PublicShell>
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
            Email confirmed
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)]">
            Your membership access is unlocked.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            Supabase has verified your email. You can sign in now, finish billing if needed, and start logging scores for the next draw.
          </p>
          <Card className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-moss)]">
              Ready next steps
            </p>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Sign in, review your charity choice, confirm your plan, and your dashboard will be ready for live draw activity.
            </p>
          </Card>
        </div>
        <Card className="self-start space-y-5 p-8">
          <Notice message={resolvedSearchParams.notice} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="ui-solid-action inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-moss)]"
            >
              Sign in now
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:-translate-y-0.5"
            >
              Review the flow
            </Link>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
}
