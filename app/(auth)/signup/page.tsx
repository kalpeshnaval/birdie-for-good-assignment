import Link from "next/link";

import { SignupForm } from "@/components/forms/signup-form";
import { PublicShell } from "@/components/site/public-shell";
import { Card } from "@/components/ui";
import { listCharities } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const charities = await listCharities();

  return (
    <PublicShell>
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
            Start your membership
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)]">
            Join with a plan, a cause, and a reason to log back in.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            Signup creates your subscriber account, activates your demo subscription, and prepares your dashboard for score entry right away.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-moss)]">Monthly</p>
              <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-ink)]">$29</p>
              <p className="text-sm leading-7 text-[var(--color-muted)]">Flexible access with every monthly draw cycle.</p>
            </Card>
            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-moss)]">Yearly</p>
              <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-ink)]">$290</p>
              <p className="text-sm leading-7 text-[var(--color-muted)]">Lower effective monthly spend and continuous entry.</p>
            </Card>
          </div>
        </div>
        <Card className="self-start p-8">
          <SignupForm charities={charities} />
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Already subscribed? <Link href="/login" className="font-semibold text-[var(--color-moss)]">Log in here</Link>
          </p>
        </Card>
      </div>
    </PublicShell>
  );
}

