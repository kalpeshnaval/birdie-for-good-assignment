export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
          404
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-ink)]">
          This fairway does not exist.
        </h1>
        <p className="text-base leading-8 text-[var(--color-muted)]">
          The route could not be found. Head back to the homepage to continue.
        </p>
      </div>
    </div>
  );
}

