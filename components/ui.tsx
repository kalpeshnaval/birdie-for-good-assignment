import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "ui-solid-action inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-moss)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-[0_30px_80px_rgba(24,34,29,0.08)] backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color:var(--color-moss)]/20 bg-[color:var(--color-moss)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <Badge>{eyebrow}</Badge>
      <h2 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--color-ink)] sm:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-8 text-[var(--color-muted)] sm:text-lg">
        {body}
      </p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="space-y-2">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">
        {value}
      </p>
      <p className="text-sm leading-7 text-[var(--color-muted)]">{hint}</p>
    </Card>
  );
}

export function Notice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      {message}
    </div>
  );
}


