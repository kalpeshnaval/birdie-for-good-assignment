import { PublicShell } from "@/components/site/public-shell";
import { Card, SectionHeading } from "@/components/ui";

const steps = [
  {
    title: "Subscribe monthly or yearly",
    body: "Members join on a flexible or discounted annual plan and unlock dashboard access right away.",
  },
  {
    title: "Enter your latest five Stableford scores",
    body: "The system keeps only the freshest five scores, sorted by date, so your draw numbers stay current automatically.",
  },
  {
    title: "Choose a charity and contribution level",
    body: "Every account starts with a meaningful contribution floor and can increase it whenever the member wants.",
  },
  {
    title: "Join the monthly draw engine",
    body: "Admins can simulate and publish draws in random or algorithmic modes, with tiered winner matching and jackpot rollover.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="A simple flow with enough structure to feel premium."
          body="The product is intentionally designed around clarity: sign up, support a cause, keep your five live scores fresh, and stay close to the next draw cycle."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={step.title} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
                Step 0{index + 1}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">
                {step.title}
              </h2>
              <p className="text-base leading-8 text-[var(--color-muted)]">{step.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}

