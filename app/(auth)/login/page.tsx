import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";
import { PublicShell } from "@/components/site/public-shell";
import { Card, Notice } from "@/components/ui";

export default async function LoginPage({
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
            Member access
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)]">
            Welcome back to the draw room.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            Sign in with your Supabase account to manage scores, billing, charity preferences, and your latest draw activity.
          </p>
          <Card className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-moss)]">
              Secure access flow
            </p>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Authentication is handled through Supabase Auth. Billing and subscription state sync through Stripe webhooks after checkout.
            </p>
          </Card>
        </div>
        <Card className="self-start p-8">
          <Notice message={resolvedSearchParams.notice} />
          <div className="mt-4">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-[var(--color-moss)]">
              Create a subscription account
            </Link>
          </p>
        </Card>
      </div>
    </PublicShell>
  );
}
