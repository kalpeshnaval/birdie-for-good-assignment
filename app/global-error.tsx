"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[var(--color-sand)] px-6">
        <div className="max-w-xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
            Something broke
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-ink)]">
            We hit an unexpected edge case.
          </h1>
          <p className="text-base leading-8 text-[var(--color-muted)]">{error.message}</p>
          <button
            onClick={reset}
            className="ui-solid-action rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}


