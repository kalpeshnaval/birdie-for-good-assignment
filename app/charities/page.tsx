import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PublicShell } from "@/components/site/public-shell";
import { Card, SectionHeading } from "@/components/ui";
import { listCharities } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CharitiesPage() {
  const charities = await listCharities();

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-14 lg:px-8 lg:py-20">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-moss)]">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <SectionHeading
            eyebrow="Charity directory"
            title="Browse the causes members can power each month."
            body="Every charity profile is designed to feel real and current, with a concise mission summary, a sense of place, and upcoming event context."
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {charities.map((charity) => (
            <Link key={charity.id} href={`/charities/${charity.slug}`}>
              <Card className="h-full space-y-5 transition hover:-translate-y-1">
                <div className={`h-44 rounded-[28px] bg-gradient-to-br ${charity.imageGradient}`} />
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    {charity.location}
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
                    {charity.name}
                  </h2>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {charity.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {charity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}

