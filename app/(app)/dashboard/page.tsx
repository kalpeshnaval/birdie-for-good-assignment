import { CalendarDays, Gift, Heart, Target } from "lucide-react";

import {
  addScoreAction,
  changePlanAction,
  manageBillingAction,
  submitClaimAction,
  updateCharityPreferenceAction,
  updateScoreAction,
} from "@/app/_actions/subscriber";
import { Card, Notice, SectionHeading, StatCard } from "@/components/ui";
import { requireSubscriber } from "@/lib/auth";
import { getCurrentMonthDraw, getUserDrawNumbers } from "@/lib/draws";
import { getDashboardSnapshot, listCharities } from "@/lib/store";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireSubscriber();
  const [snapshot, charities, resolvedSearchParams] = await Promise.all([
    getDashboardSnapshot(user.id),
    listCharities(),
    searchParams,
  ]);

  if (!snapshot) {
    return null;
  }

  const currentDraw = getCurrentMonthDraw(snapshot.draws);
  const latestWin = snapshot.draws.find((draw) =>
    draw.winners.some((winner) => winner.userId === user.id),
  );
  const latestWinEntry = latestWin?.winners.find((winner) => winner.userId === user.id);

  return (
    <div className="space-y-10">
      <Notice message={resolvedSearchParams.notice} />
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6 p-8" data-surface="mesh">
          <SectionHeading
            eyebrow="Member dashboard"
            title="Your latest five scores are the center of gravity."
            body="The dashboard keeps subscription status, charity alignment, score updates, and draw participation in one place so the experience feels continuous instead of fragmented."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Subscription"
              value={snapshot.subscription?.status ?? "Inactive"}
              hint={snapshot.subscription ? `${snapshot.subscription.plan} plan renews on ${snapshot.subscription.renewalDate}.` : "Choose a plan to activate draw access."}
            />
            <StatCard
              label="Current numbers"
              value={getUserDrawNumbers(snapshot.scores).join(" · ") || "No scores"}
              hint="Your live set for draw matching uses the latest five values."
            />
            <StatCard
              label="Total won"
              value={formatCurrency(snapshot.winningsCents)}
              hint="Winner tiers and payment states are tracked automatically."
            />
          </div>
        </Card>
        <Card className="space-y-5 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">
            Participation summary
          </p>
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-ink)]">
              {currentDraw ? currentDraw.label : "Upcoming draw"}
            </p>
            <p className="text-base leading-8 text-[var(--color-muted)]">
              {currentDraw
                ? `Winning numbers: ${currentDraw.winningNumbers.join(", ")}.`
                : "No published draw yet. Your next score updates will still shape your future participation."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Selected charity</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{snapshot.selectedCharity.name}</p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Contribution level</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{formatPercent(snapshot.user.charityPercentage)}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--color-moss)]" />
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">Score management</h2>
          </div>
          <form action={addScoreAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              name="value"
              type="number"
              min={1}
              max={45}
              placeholder="Stableford score"
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
              required
            />
            <input
              name="playedAt"
              type="date"
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
              required
            />
            <button className="ui-solid-action rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]">
              Add score
            </button>
          </form>
          <div className="space-y-4">
            {snapshot.scores.map((score) => (
              <form key={score.id} action={updateScoreAction} className="grid gap-3 rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                <input type="hidden" name="scoreId" value={score.id} />
                <input
                  name="value"
                  type="number"
                  min={1}
                  max={45}
                  defaultValue={score.value}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
                />
                <input
                  name="playedAt"
                  type="date"
                  defaultValue={score.playedAt}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
                />
                <button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)] hover:text-[var(--color-moss)]">
                  Save
                </button>
              </form>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-[var(--color-coral)]" />
              <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">Charity settings</h2>
            </div>
            <form action={updateCharityPreferenceAction} className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
              <select
                name="charityId"
                defaultValue={snapshot.selectedCharity.id}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
              >
                {charities.map((charity) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
              <input
                name="charityPercentage"
                type="number"
                min={10}
                max={80}
                defaultValue={snapshot.user.charityPercentage}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
              />
              <button className="ui-solid-action rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]">
                Update
              </button>
            </form>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[var(--color-gold)]" />
              <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">Plan control</h2>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
              {([
                ["monthly", "$29 / month"],
                ["yearly", "$290 / year"],
              ] as const).map(([plan, price]) => (
                <form key={plan} action={changePlanAction} className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                  <input type="hidden" name="plan" value={plan} />
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{plan}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">{price}</p>
                  <button className="mt-4 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)] hover:text-[var(--color-moss)]">
                    Switch to {plan}
                  </button>
                </form>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={manageBillingAction}>
                <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)] hover:text-[var(--color-moss)]">
                  Open billing portal
                </button>
              </form>
              <p className="text-sm leading-7 text-[var(--color-muted)]">Stripe-backed plans create or update subscriptions through checkout and webhooks. If Stripe is not configured, the admin-managed fallback stays available for testing.</p>
            </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-[var(--color-gold)]" />
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">Winnings and verification</h2>
          </div>
          {latestWin && latestWinEntry ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Latest win: {latestWin.label} / {latestWinEntry.matchTier}-number match
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Prize status: {latestWinEntry.status}. Winning numbers were {latestWin.winningNumbers.join(", ")}.
                </p>
              </div>
              {snapshot.pendingClaim ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                  Claim status: {snapshot.pendingClaim.reviewStatus} / payout {snapshot.pendingClaim.paymentStatus}. {snapshot.pendingClaim.notes}
                </div>
              ) : (
                <form action={submitClaimAction} className="space-y-4 rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                  <input type="hidden" name="drawId" value={latestWin.id} />
                  <label className="block text-sm font-semibold text-[var(--color-ink)]">Upload a screenshot proof</label>
                  <input
                    type="file"
                    name="proof"
                    accept="image/*"
                    required
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  />
                  <button className="ui-solid-action rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]">
                    Submit proof
                  </button>
                </form>
              )}
            </div>
          ) : (
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              No verified winning tier yet. Keep your latest five scores fresh so you are ready for the next cycle.
            </p>
          )}
        </Card>
        <Card className="space-y-5">
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-ink)]">Draw history</h2>
          <div className="space-y-4">
            {snapshot.draws.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No draw history yet.</p>
            ) : (
              snapshot.draws.slice(0, 4).map((draw) => {
                const winner = draw.winners.find((entry) => entry.userId === user.id);
                return (
                  <div key={draw.id} className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-[var(--color-ink)]">{draw.label}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{draw.status}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                      Winning numbers: {draw.winningNumbers.join(", ")}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                      {winner
                        ? `You matched ${winner.matchTier} numbers and ${winner.status === "paid" ? "were paid" : "are in payout review"}.`
                        : "You were entered in the cycle but did not land a winning tier this time."}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}





