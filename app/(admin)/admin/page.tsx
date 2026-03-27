import Link from "next/link";

import {
  createCharityAction,
  publishDrawAction,
  reviewClaimAction,
  simulateDrawAction,
  updateSubscriberPlanAction,
} from "@/app/_actions/admin";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card, Notice, StatCard } from "@/components/ui";
import { getAdminSnapshot } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [snapshot, resolvedSearchParams] = await Promise.all([
    getAdminSnapshot(),
    searchParams,
  ]);

  return (
    <div className="space-y-10">
      <Notice message={resolvedSearchParams.notice} />
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={String(snapshot.analytics.totalUsers)} hint="All platform accounts." />
        <StatCard label="Active subscribers" value={String(snapshot.analytics.activeSubscribers)} hint="Users currently contributing to draws." />
        <StatCard label="Prize pool" value={formatCurrency(snapshot.analytics.totalPrizePool)} hint="Total across saved draw runs." />
        <StatCard label="Charity flow" value={formatCurrency(snapshot.analytics.totalCharityContribution)} hint="Current monthly equivalent going to impact." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">Draw controls</p>
          <form action={simulateDrawAction} className="space-y-3 rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
            <select name="mode" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none">
              <option value="random">Random draw</option>
              <option value="hot">Algorithmic hot scores</option>
              <option value="cold">Algorithmic cold scores</option>
            </select>
            <FormSubmitButton
              idleLabel="Run simulation"
              pendingLabel="Running..."
              className="w-full rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)] hover:text-[var(--color-moss)]"
            />
          </form>
          <form action={publishDrawAction} className="space-y-3 rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
            <select name="mode" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none">
              <option value="random">Random draw</option>
              <option value="hot">Algorithmic hot scores</option>
              <option value="cold">Algorithmic cold scores</option>
            </select>
            <FormSubmitButton
              idleLabel="Publish live draw"
              pendingLabel="Publishing..."
              className="ui-solid-action w-full rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]"
            />
          </form>
        </Card>
        <Card className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">Recent draws</p>
          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.draws.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No draw runs yet.</p>
            ) : (
              snapshot.draws.slice(0, 4).map((draw) => (
                <div key={draw.id} className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-[var(--color-ink)]">{draw.label}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{draw.status}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">Winning numbers: {draw.winningNumbers.join(", ")}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">Pool: {formatCurrency(draw.prizePoolCents)} / winners: {draw.winners.length}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5 overflow-x-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">Subscriber management</p>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[var(--color-muted)]">
                <th className="px-3 py-3 font-semibold">Member</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.users.map((user) => {
                const subscription = snapshot.subscriptions.find((entry) => entry.userId === user.id);
                return (
                  <tr key={user.id} className="border-b border-black/5 align-top">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-[var(--color-ink)]">{user.name}</p>
                      <p className="text-[var(--color-muted)]">{user.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <form action={updateSubscriberPlanAction} className="flex min-w-[300px] flex-col gap-3">
                        <input type="hidden" name="userId" value={user.id} />
                        <select name="plan" defaultValue={subscription?.plan ?? "monthly"} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <select name="status" defaultValue={subscription?.status ?? "inactive"} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="past_due">Past due</option>
                          <option value="canceled">Canceled</option>
                        </select>
                        <FormSubmitButton
                          idleLabel="Save subscription"
                          pendingLabel="Saving..."
                          className="rounded-full border border-black/10 px-4 py-2 font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)] hover:text-[var(--color-moss)]"
                        />
                      </form>
                    </td>
                    <td className="px-3 py-4 text-[var(--color-muted)]">{subscription?.status ?? "inactive"}</td>
                    <td className="px-3 py-4 text-[var(--color-muted)]">{user.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">Add charity</p>
          <form action={createCharityAction} className="space-y-3">
            <input name="name" placeholder="Charity name" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
            <input name="location" placeholder="Location" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
            <input name="headline" placeholder="Short headline" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
            <textarea name="summary" placeholder="Summary and mission" rows={5} className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
            <FormSubmitButton
              idleLabel="Add charity profile"
              pendingLabel="Adding..."
              className="ui-solid-action w-full rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-moss)]"
            />
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">Winner claims</p>
          <div className="space-y-4">
            {snapshot.claims.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No claims submitted yet.</p>
            ) : (
              snapshot.claims.map((claim) => (
                <form key={claim.id} action={reviewClaimAction} className="space-y-3 rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                  <input type="hidden" name="claimId" value={claim.id} />
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-ink)]">{claim.fileName}</p>
                    <p className="text-sm text-[var(--color-muted)]">{claim.reviewStatus} / {claim.paymentStatus}</p>
                    <Link href={`/api/proofs/${claim.proofId}`} className="mt-2 inline-block text-sm font-semibold text-[var(--color-moss)]">
                      View proof file
                    </Link>
                  </div>
                  <select name="reviewStatus" defaultValue={claim.reviewStatus} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select name="paymentStatus" defaultValue={claim.paymentStatus} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <textarea name="notes" defaultValue={claim.notes} rows={3} className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
                  <FormSubmitButton
                    idleLabel="Save claim review"
                    pendingLabel="Saving..."
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-moss)] hover:text-[var(--color-moss)]"
                  />
                </form>
              ))
            )}
          </div>
        </Card>
        <Card className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-moss)]">Notifications and audit trail</p>
          <div className="space-y-4">
            {snapshot.notifications.map((notification) => (
              <div key={notification.id} className="rounded-3xl border border-black/10 bg-[var(--color-sand)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{notification.subject}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{notification.preview}</p>
              </div>
            ))}
            {snapshot.auditLogs.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-black/10 bg-white p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{entry.action.replace(/_/g, " ")}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{entry.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
