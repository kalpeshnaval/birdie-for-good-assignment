import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";

import { PublicShell } from "@/components/site/public-shell";
import { Card } from "@/components/ui";
import { getCharityBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const charity = await getCharityBySlug(slug);

  if (!charity) {
    notFound();
  }

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 lg:px-8 lg:py-20">
        <Link href="/charities" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-moss)]">
          <ArrowLeft className="h-4 w-4" />
          Back to charities
        </Link>
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
              {charity.location}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-ink)]">
              {charity.name}
            </h1>
            <p className="text-xl leading-8 text-[var(--color-muted)]">{charity.headline}</p>
            <p className="max-w-2xl text-base leading-8 text-[var(--color-muted)]">{charity.mission}</p>
          </div>
          <div className={`min-h-80 rounded-[36px] bg-gradient-to-br ${charity.imageGradient}`} />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">
              Why members pick this cause
            </h2>
            <p className="text-base leading-8 text-[var(--color-muted)]">{charity.summary}</p>
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
          <Card className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">
              Upcoming events
            </h2>
            {charity.events.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No upcoming events yet.</p>
            ) : (
              charity.events.map((event) => (
                <div key={event.id} className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                  <p className="text-lg font-semibold text-[var(--color-ink)]">{event.title}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <CalendarDays className="h-4 w-4" />
                    {event.date}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </PublicShell>
  );
}

