import Link from "next/link";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { PublicShell } from "@/components/site/public-shell";
import { Card, Notice } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [supabase, resolvedSearchParams] = await Promise.all([
    createSupabaseServerClient(),
    searchParams,
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?notice=" +
        encodeURIComponent("Open the reset link from your email to choose a new password."),
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
            Reset password
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)]">
            Lock in a new password and get back to the draw.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            Your recovery link is active. Set a new password now and then sign back in with the updated credentials.
          </p>
          <Card className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-moss)]">
              Secure recovery session
            </p>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Supabase has already restored a temporary recovery session for {user.email ?? "your account"}. This page only appears after the email link succeeds.
            </p>
          </Card>
        </div>
        <Card className="self-start p-8">
          <Notice message={resolvedSearchParams.notice} />
          <div className="mt-4">
            <ResetPasswordForm />
          </div>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Back to access?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-moss)]">
              Return to login
            </Link>
          </p>
        </Card>
      </div>
    </PublicShell>
  );
}