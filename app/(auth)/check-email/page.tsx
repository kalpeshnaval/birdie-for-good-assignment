import Link from "next/link";

import { ResendConfirmationForm } from "@/components/forms/resend-confirmation-form";
import { PublicShell } from "@/components/site/public-shell";
import { Card, Notice } from "@/components/ui";

function getCopy(mode: string | undefined) {
  if (mode === "recovery") {
    return {
      eyebrow: "Check your inbox",
      title: "Your password reset link is on the way.",
      body: "Open the email from Supabase Auth and follow the secure link back into the app. You&apos;ll land on a dedicated page to choose your new password.",
    };
  }

  return {
    eyebrow: "Confirm your email",
    title: "One more step before member access.",
    body: "We&apos;ve sent a confirmation email for your new account. Once you click it, you&apos;ll come back to a proper success page and can continue into the app.",
  };
}

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; email?: string; notice?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const copy = getCopy(resolvedSearchParams.mode);

  return (
    <PublicShell>
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
            {copy.eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)]">
            {copy.title}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            {copy.body}
          </p>
          {resolvedSearchParams.email ? (
            <Card>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                We&apos;re targeting <span className="font-semibold text-[var(--color-ink)]">{resolvedSearchParams.email}</span>.
              </p>
            </Card>
          ) : null}
        </div>
        <Card className="self-start space-y-5 p-8">
          <Notice message={resolvedSearchParams.notice} />
          <div className="space-y-3 text-sm leading-7 text-[var(--color-muted)]">
            <p>Keep this tab open while you check your inbox so you can return smoothly.</p>
            <p>Be sure to check spam, promotions, and filtered folders if the email doesn&apos;t show up right away.</p>
          </div>
          {resolvedSearchParams.mode !== "recovery" && resolvedSearchParams.email ? (
            <div className="space-y-3 rounded-[28px] border border-black/8 bg-[var(--color-paper)]/70 p-5">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Need another confirmation email?</p>
              <ResendConfirmationForm email={resolvedSearchParams.email} />
            </div>
          ) : null}
          <p className="text-sm text-[var(--color-muted)]">
            Want to head back?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-moss)]">
              Return to login
            </Link>
          </p>
        </Card>
      </div>
    </PublicShell>
  );
}
