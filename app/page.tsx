import Link from "next/link";
import { ArrowRight, HeartHandshake, Sparkles, Trophy } from "lucide-react";

import { PublicShell } from "@/components/site/public-shell";
import { Card, SectionHeading, StatCard } from "@/components/ui";
import { getPublicSnapshot } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getPublicSnapshot();

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-14 lg:px-8 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-moss)]">
              <Sparkles className="h-4 w-4" />
              Charity-first golf platform
            </div>
            <div className="space-y-6">
              <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)] sm:text-7xl lg:text-8xl">
                Track five scores. Back a cause. Show up for the next draw.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
                Birdie for Good turns a golf habit into a monthly ritual with visible charity impact, a premium member dashboard, and draw mechanics that feel alive instead of stale.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="ui-solid-action inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-moss)]"
              >
                Start your subscription
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/70 px-6 py-4 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)]"
              >
                See how the draw works
              </Link>
            </div>
          </div>
          <Card className="grid gap-6 p-8" data-surface="mesh">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
                Momentum this month
              </p>
              <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-ink)]">
                {snapshot.latestDraw ? snapshot.latestDraw.label : "Fresh cycle"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Active subscribers"
                value={String(snapshot.subscriberCount)}
                hint="Members with an active plan and draw access."
              />
              <StatCard
                label="Monthly charity impact"
                value={formatCurrency(snapshot.totalRaisedCents)}
                hint="Based on current live contribution preferences."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-black/10 bg-white/70 p-4">
                <HeartHandshake className="mb-3 h-5 w-5 text-[var(--color-coral)]" />
                <p className="text-sm font-semibold text-[var(--color-ink)]">Choose your charity</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Support a cause from day one and raise your contribution anytime.</p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white/70 p-4">
                <Trophy className="mb-3 h-5 w-5 text-[var(--color-gold)]" />
                <p className="text-sm font-semibold text-[var(--color-ink)]">Monthly prize logic</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Automatic pool calculations, match tiers, and jackpot rollover.</p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white/70 p-4">
                <Sparkles className="mb-3 h-5 w-5 text-[var(--color-moss)]" />
                <p className="text-sm font-semibold text-[var(--color-ink)]">Premium experience</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Modern motion, sharp typography, and a dashboard that feels intentional.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Support"
            value="10%+"
            hint="Every member starts with a meaningful contribution floor."
          />
          <StatCard
            label="Game rule"
            value="Last 5"
            hint="Your latest five Stableford scores become your live number set."
          />
          <StatCard
            label="Reward tiers"
            value="3 / 4 / 5"
            hint="Tiered winners split the pool while the jackpot can roll over."
          />
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            eyebrow="Featured charities"
            title="The impact stays visible, not hidden in the fine print."
            body="The homepage leads with outcomes, not golf cliches. Members can browse active charities, discover upcoming events, and align their subscription with a mission they care about."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.featuredCharities.map((charity) => (
              <Link key={charity.id} href={`/charities/${charity.slug}`}>
                <Card className="h-full space-y-5 transition hover:-translate-y-1">
                  <div className={`h-40 rounded-[24px] bg-gradient-to-br ${charity.imageGradient}`} />
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      {charity.location}
                    </p>
                    <h3 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
                      {charity.name}
                    </h3>
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      {charity.headline}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}


