import "server-only";

import { randomUUID } from "node:crypto";

import { format } from "date-fns";

import { appConfig, isConfiguredAdminEmail, planCatalog } from "@/lib/config";
import {
  generateWinningNumbers,
  getMatchTier,
  getMonthlyEquivalentCents,
  getNextRenewalDate,
  getPrizePoolCents,
  keepLatestScores,
} from "@/lib/draws";
import { logError, logInfo } from "@/lib/logger";
import { sendPlatformEmail } from "@/lib/providers";
import { seedCharities } from "@/lib/seed-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AdminSnapshot,
  AuditLog,
  Charity,
  CharityEvent,
  DashboardSnapshot,
  DrawMode,
  DrawRun,
  MatchTier,
  ReviewStatus,
  ScoreEntry,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  SystemNotification,
  User,
  WinnerClaim,
} from "@/lib/types";

const storageBucket = appConfig.proofsBucket;

function getIsoNow() {
  return new Date().toISOString();
}

function ensureSupabaseAdmin() {
  if (!appConfig.hasSupabaseAdmin) {
    throw new Error(
      "Supabase admin configuration is missing. Add the Supabase environment variables before using data mutations.",
    );
  }

  return createSupabaseAdminClient();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function parseCharityEvents(value: unknown): CharityEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(Boolean).map((entry, index) => {
    const event = (entry ?? {}) as Partial<CharityEvent>;

    return {
      id: event.id ?? `event-${index + 1}`,
      title: event.title ?? "Upcoming event",
      location: event.location ?? "TBD",
      date: event.date ?? format(new Date(), "yyyy-MM-dd"),
    } satisfies CharityEvent;
  });
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function parseDrawWinners(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const winner = entry as DrawRun["winners"][number];

      if (!winner?.userId || !winner?.matchTier) {
        return null;
      }

      return {
        userId: winner.userId,
        matchTier: winner.matchTier,
        prizeCents: Number(winner.prizeCents ?? 0),
        status: winner.status ?? "pending",
      } satisfies DrawRun["winners"][number];
    })
    .filter(Boolean) as DrawRun["winners"];
}

function mapCharity(row: Record<string, unknown>): Charity {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    location: String(row.location),
    headline: String(row.headline),
    summary: String(row.summary),
    mission: String(row.mission),
    imageGradient: String(row.image_gradient),
    featured: Boolean(row.featured),
    tags: parseStringArray(row.tags),
    events: parseCharityEvents(row.events),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role === "admin" ? "admin" : "subscriber",
    createdAt: String(row.created_at),
    selectedCharityId: row.selected_charity_id ? String(row.selected_charity_id) : null,
    charityPercentage: Number(row.charity_percentage ?? appConfig.defaultCharityPercentage),
    avatarSeed: String(row.avatar_seed ?? slugify(String(row.name ?? "member"))),
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
  };
}

function mapSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    plan: row.plan === "yearly" ? "yearly" : "monthly",
    status:
      row.status === "active" ||
      row.status === "inactive" ||
      row.status === "canceled" ||
      row.status === "past_due"
        ? row.status
        : "inactive",
    provider: row.provider === "stripe" ? "stripe" : "admin",
    amountCents: Number(row.amount_cents ?? 0),
    startedAt: String(row.started_at),
    renewalDate: String(row.renewal_date),
    canceledAt: row.canceled_at ? String(row.canceled_at) : null,
    stripeSubscriptionId: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    stripePriceId: row.stripe_price_id ? String(row.stripe_price_id) : null,
  };
}

function mapScore(row: Record<string, unknown>): ScoreEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    value: Number(row.value),
    playedAt: String(row.played_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapDraw(row: Record<string, unknown>): DrawRun {
  return {
    id: String(row.id),
    monthKey: String(row.month_key),
    label: String(row.label),
    mode:
      row.mode === "hot" || row.mode === "cold" || row.mode === "random"
        ? row.mode
        : "random",
    status:
      row.status === "draft" || row.status === "simulated" || row.status === "published"
        ? row.status
        : "draft",
    winningNumbers: Array.isArray(row.winning_numbers)
      ? row.winning_numbers.map((value) => Number(value))
      : [],
    activeSubscriberCount: Number(row.active_subscriber_count ?? 0),
    prizePoolCents: Number(row.prize_pool_cents ?? 0),
    rolloverCents: Number(row.rollover_cents ?? 0),
    winners: parseDrawWinners(row.winners),
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapClaim(row: Record<string, unknown>): WinnerClaim {
  return {
    id: String(row.id),
    drawId: String(row.draw_id),
    userId: String(row.user_id),
    proofId: String(row.proof_id),
    fileName: String(row.file_name),
    proofPath: String(row.proof_path),
    submittedAt: String(row.submitted_at),
    reviewStatus:
      row.review_status === "approved" || row.review_status === "rejected"
        ? row.review_status
        : "pending",
    paymentStatus:
      row.payment_status === "processing" || row.payment_status === "paid" || row.payment_status === "rejected"
        ? row.payment_status
        : "pending",
    notes: String(row.notes ?? ""),
  };
}

function mapNotification(row: Record<string, unknown>): SystemNotification {
  return {
    id: String(row.id),
    type:
      row.type === "subscription" || row.type === "draw" || row.type === "winner" || row.type === "proof"
        ? row.type
        : "signup",
    channel: row.channel === "email" ? "email" : "system",
    subject: String(row.subject),
    preview: String(row.preview),
    userId: row.user_id ? String(row.user_id) : null,
    createdAt: String(row.created_at),
    status: row.status === "sent" ? "sent" : "skipped",
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    entityType: String(row.entity_type),
    entityId: row.entity_id ? String(row.entity_id) : null,
    action: String(row.action),
    detail: String(row.detail),
    createdAt: String(row.created_at),
  };
}

async function ensureSeedCharities() {
  if (!appConfig.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("charities")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const rows = seedCharities.map((charity) => ({
    id: charity.id,
    slug: charity.slug,
    name: charity.name,
    location: charity.location,
    headline: charity.headline,
    summary: charity.summary,
    mission: charity.mission,
    image_gradient: charity.imageGradient,
    featured: charity.featured,
    tags: charity.tags,
    events: charity.events,
  }));

  const { error: insertError } = await supabase
    .from("charities")
    .upsert(rows, { onConflict: "id" });

  if (insertError) {
    throw insertError;
  }
}

async function insertNotification(input: Omit<SystemNotification, "id" | "createdAt">) {
  if (!appConfig.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("notifications").insert({
    id: randomUUID(),
    type: input.type,
    channel: input.channel,
    subject: input.subject,
    preview: input.preview,
    user_id: input.userId ?? null,
    status: input.status,
  });
}

async function insertAuditLog(input: Omit<AuditLog, "id" | "createdAt">) {
  if (!appConfig.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("audit_logs").insert({
    id: randomUUID(),
    actor_user_id: input.actorUserId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    detail: input.detail,
  });
}

async function trimScoresToLatestFive(userId: string) {
  const supabase = ensureSupabaseAdmin();
  const { data, error } = await supabase
    .from("scores")
    .select("id, user_id, value, played_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const scores = (data ?? []).map((row) => mapScore(row));
  const keepIds = new Set(keepLatestScores(scores).map((score) => score.id));
  const deleteIds = scores.filter((score) => !keepIds.has(score.id)).map((score) => score.id);

  if (deleteIds.length > 0) {
    const { error: deleteError } = await supabase.from("scores").delete().in("id", deleteIds);

    if (deleteError) {
      throw deleteError;
    }
  }
}

function fallbackPublicSnapshot() {
  return {
    featuredCharities: seedCharities.filter((charity) => charity.featured),
    subscriberCount: 0,
    totalRaisedCents: 0,
    latestDraw: null,
  };
}

export async function listCharities() {
  if (!appConfig.hasSupabaseAdmin) {
    return seedCharities;
  }

  await ensureSeedCharities();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapCharity(row));
}

export async function getPublicSnapshot() {
  if (!appConfig.hasSupabaseAdmin) {
    return fallbackPublicSnapshot();
  }

  await ensureSeedCharities();
  const supabase = createSupabaseAdminClient();

  const results = await Promise.all([
    supabase.from("charities").select("*").eq("featured", true).order("name"),
    supabase.from("subscriptions").select("*").eq("status", "active"),
    supabase.from("profiles").select("id, charity_percentage"),
    supabase.from("draws").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(1),
  ]);

  const [charities, subscriptions, profiles, draws] = results;

  if (charities.error) throw charities.error;
  if (subscriptions.error) throw subscriptions.error;
  if (profiles.error) throw profiles.error;
  if (draws.error) throw draws.error;

  const profilePercentages = new Map(
    (profiles.data ?? []).map((profile) => [
      String(profile.id),
      Number(profile.charity_percentage ?? appConfig.defaultCharityPercentage),
    ]),
  );

  const totalRaisedCents = (subscriptions.data ?? []).reduce((sum, row) => {
    const subscription = mapSubscription(row);
    const monthlyEquivalent = getMonthlyEquivalentCents(subscription);
    const charityPercentage = profilePercentages.get(subscription.userId) ?? 0;
    return sum + Math.round(monthlyEquivalent * (charityPercentage / 100));
  }, 0);

  return {
    featuredCharities: (charities.data ?? []).map((row) => mapCharity(row)),
    subscriberCount: subscriptions.data?.length ?? 0,
    totalRaisedCents,
    latestDraw: draws.data?.[0] ? mapDraw(draws.data[0]) : null,
  };
}

export async function getCharityBySlug(slug: string) {
  if (!appConfig.hasSupabaseAdmin) {
    return seedCharities.find((charity) => charity.slug === slug) ?? null;
  }

  await ensureSeedCharities();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("charities").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCharity(data) : null;
}

export async function getUserById(userId: string) {
  if (!appConfig.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapUser(data) : null;
}

export async function getUserSubscription(userId: string) {
  if (!appConfig.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSubscription(data) : null;
}

export async function provisionUserAccount(input: {
  userId: string;
  name: string;
  email: string;
  plan: SubscriptionPlan;
  charityId: string;
  charityPercentage: number;
}) {
  const supabase = ensureSupabaseAdmin();
  await ensureSeedCharities();

  const now = getIsoNow();
  const startedAt = format(new Date(), "yyyy-MM-dd");
  const role = isConfiguredAdminEmail(input.email) ? "admin" : "subscriber";

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: input.userId,
      email: input.email.trim().toLowerCase(),
      name: input.name,
      role,
      selected_charity_id: input.charityId,
      charity_percentage: input.charityPercentage,
      avatar_seed: slugify(input.name),
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw profileError;
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      user_id: input.userId,
      plan: input.plan,
      status: appConfig.hasStripeCheckout ? "inactive" : "active",
      provider: appConfig.hasStripeCheckout ? "stripe" : "admin",
      amount_cents: planCatalog[input.plan].priceCents,
      started_at: startedAt,
      renewal_date: getNextRenewalDate(startedAt, input.plan),
    },
    { onConflict: "user_id" },
  );

  if (subscriptionError) {
    throw subscriptionError;
  }

  await Promise.all([
    insertNotification({
      type: "signup",
      channel: "system",
      userId: input.userId,
      subject: "Welcome to Birdie for Good",
      preview: `${input.name} joined on the ${input.plan} plan.`,
      status: "sent",
    }),
    insertAuditLog({
      actorUserId: input.userId,
      entityType: "profile",
      entityId: input.userId,
      action: "signup_provisioned",
      detail: `Provisioned ${role} profile and ${input.plan} subscription preference.`,
    }),
  ]);

  return getUserById(input.userId);
}

export async function getDashboardSnapshot(userId: string): Promise<DashboardSnapshot | null> {
  if (!appConfig.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  await ensureSeedCharities();

  const [user, subscription, charities, scoreRows, drawRows, claimRows] = await Promise.all([
    getUserById(userId),
    getUserSubscription(userId),
    listCharities(),
    supabase.from("scores").select("*").eq("user_id", userId).order("played_at", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("draws").select("*").order("created_at", { ascending: false }),
    supabase.from("winner_claims").select("*").eq("user_id", userId).order("submitted_at", { ascending: false }),
  ]);

  if (!user) {
    return null;
  }

  if (scoreRows.error) throw scoreRows.error;
  if (drawRows.error) throw drawRows.error;
  if (claimRows.error) throw claimRows.error;

  const scores = keepLatestScores((scoreRows.data ?? []).map((row) => mapScore(row)));
  const draws = (drawRows.data ?? []).map((row) => mapDraw(row));
  const claims = (claimRows.data ?? []).map((row) => mapClaim(row));
  const selectedCharity = charities.find((charity) => charity.id === user.selectedCharityId) ?? charities[0];
  const pendingClaim = claims.find((claim) => claim.reviewStatus === "pending" || claim.paymentStatus !== "paid") ?? null;
  const winningsCents = draws.reduce(
    (sum, draw) => sum + draw.winners.filter((winner) => winner.userId === user.id).reduce((winnerSum, winner) => winnerSum + winner.prizeCents, 0),
    0,
  );

  return {
    user,
    subscription,
    selectedCharity,
    scores,
    draws,
    pendingClaim,
    winningsCents,
  };
}

export async function addScore(userId: string, input: { value: number; playedAt: string }) {
  const supabase = ensureSupabaseAdmin();
  const now = getIsoNow();
  const { error } = await supabase.from("scores").insert({
    id: randomUUID(),
    user_id: userId,
    value: input.value,
    played_at: input.playedAt,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    throw error;
  }

  await Promise.all([
    trimScoresToLatestFive(userId),
    insertAuditLog({
      actorUserId: userId,
      entityType: "score",
      action: "score_added",
      detail: `Added score ${input.value} for ${input.playedAt}.`,
    }),
  ]);
}

export async function updateScore(userId: string, input: { scoreId: string; value: number; playedAt: string }) {
  const supabase = ensureSupabaseAdmin();
  const { error } = await supabase
    .from("scores")
    .update({ value: input.value, played_at: input.playedAt, updated_at: getIsoNow() })
    .eq("id", input.scoreId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  await Promise.all([
    trimScoresToLatestFive(userId),
    insertAuditLog({
      actorUserId: userId,
      entityType: "score",
      entityId: input.scoreId,
      action: "score_updated",
      detail: `Updated score to ${input.value} for ${input.playedAt}.`,
    }),
  ]);
}

export async function updateCharityPreference(userId: string, input: { charityId: string; charityPercentage: number }) {
  const supabase = ensureSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ selected_charity_id: input.charityId, charity_percentage: input.charityPercentage, updated_at: getIsoNow() })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  await insertAuditLog({
    actorUserId: userId,
    entityType: "profile",
    entityId: userId,
    action: "charity_preference_updated",
    detail: `Selected charity ${input.charityId} at ${input.charityPercentage} percent.`,
  });
}

export async function saveProofFile(userId: string, proofId: string, fileName: string, bytes: Uint8Array) {
  const supabase = ensureSupabaseAdmin();
  const safeName = normalizeFileName(fileName);
  const proofPath = `${userId}/${proofId}-${safeName}`;

  const { error } = await supabase.storage.from(storageBucket).upload(proofPath, bytes, {
    contentType: "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return proofPath;
}

export async function createWinnerClaim(
  userId: string,
  input: { drawId: string; proofId: string; proofPath: string; fileName: string },
) {
  const supabase = ensureSupabaseAdmin();
  const existingClaim = await supabase.from("winner_claims").select("id").eq("draw_id", input.drawId).eq("user_id", userId).maybeSingle();

  if (existingClaim.error) {
    throw existingClaim.error;
  }

  if (existingClaim.data) {
    throw new Error("A verification proof already exists for this draw.");
  }

  const { data, error } = await supabase
    .from("winner_claims")
    .insert({
      id: randomUUID(),
      draw_id: input.drawId,
      user_id: userId,
      proof_id: input.proofId,
      proof_path: input.proofPath,
      file_name: input.fileName,
      review_status: "pending",
      payment_status: "pending",
      notes: "Awaiting admin review.",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await Promise.all([
    insertNotification({
      type: "proof",
      channel: "system",
      userId,
      subject: "Winner proof submitted",
      preview: `${input.fileName} is ready for admin review.`,
      status: "sent",
    }),
    insertAuditLog({
      actorUserId: userId,
      entityType: "claim",
      entityId: String(data.id),
      action: "proof_submitted",
      detail: `Uploaded ${input.fileName} for draw ${input.drawId}.`,
    }),
  ]);

  return mapClaim(data);
}

export async function getProofAsset(proofId: string) {
  const supabase = ensureSupabaseAdmin();
  const { data: claim, error } = await supabase.from("winner_claims").select("proof_path, file_name").eq("proof_id", proofId).maybeSingle();

  if (error) {
    throw error;
  }

  if (!claim) {
    return null;
  }

  const { data, error: downloadError } = await supabase.storage.from(storageBucket).download(String(claim.proof_path));

  if (downloadError) {
    throw downloadError;
  }

  return {
    fileName: String(claim.file_name),
    buffer: Buffer.from(await data.arrayBuffer()),
  };
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  if (!appConfig.hasSupabaseAdmin) {
    return {
      users: [],
      subscriptions: [],
      charities: seedCharities,
      scores: [],
      draws: [],
      claims: [],
      notifications: [],
      auditLogs: [],
      analytics: {
        totalUsers: 0,
        activeSubscribers: 0,
        totalPrizePool: 0,
        totalCharityContribution: 0,
        drawCount: 0,
      },
    };
  }

  const supabase = createSupabaseAdminClient();
  await ensureSeedCharities();

  const [profiles, subscriptions, charities, scores, draws, claims, notifications, auditLogs] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").order("started_at", { ascending: false }),
    supabase.from("charities").select("*").order("featured", { ascending: false }).order("name"),
    supabase.from("scores").select("*").order("played_at", { ascending: false }),
    supabase.from("draws").select("*").order("created_at", { ascending: false }),
    supabase.from("winner_claims").select("*").order("submitted_at", { ascending: false }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  if (profiles.error) throw profiles.error;
  if (subscriptions.error) throw subscriptions.error;
  if (charities.error) throw charities.error;
  if (scores.error) throw scores.error;
  if (draws.error) throw draws.error;
  if (claims.error) throw claims.error;
  if (notifications.error) throw notifications.error;
  if (auditLogs.error) throw auditLogs.error;

  const users = (profiles.data ?? []).map((row) => mapUser(row));
  const mappedSubscriptions = (subscriptions.data ?? []).map((row) => mapSubscription(row));
  const mappedDraws = (draws.data ?? []).map((row) => mapDraw(row));
  const activeSubscriptions = mappedSubscriptions.filter((subscription) => subscription.status === "active");
  const totalCharityContribution = activeSubscriptions.reduce((sum, subscription) => {
    const user = users.find((entry) => entry.id === subscription.userId);
    const monthlyEquivalent = getMonthlyEquivalentCents(subscription);
    return sum + Math.round(monthlyEquivalent * ((user?.charityPercentage ?? 0) / 100));
  }, 0);

  return {
    users,
    subscriptions: mappedSubscriptions,
    charities: (charities.data ?? []).map((row) => mapCharity(row)),
    scores: (scores.data ?? []).map((row) => mapScore(row)),
    draws: mappedDraws,
    claims: (claims.data ?? []).map((row) => mapClaim(row)),
    notifications: (notifications.data ?? []).map((row) => mapNotification(row)),
    auditLogs: (auditLogs.data ?? []).map((row) => mapAuditLog(row)),
    analytics: {
      totalUsers: users.length,
      activeSubscribers: activeSubscriptions.length,
      totalPrizePool: mappedDraws.reduce((sum, draw) => sum + draw.prizePoolCents, 0),
      totalCharityContribution,
      drawCount: mappedDraws.length,
    },
  };
}

export async function createOrUpdateSubscription(
  userId: string,
  input: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    provider?: Subscription["provider"];
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    stripeCustomerId?: string | null;
    startedAt?: string;
    renewalDate?: string;
    canceledAt?: string | null;
  },
) {
  const supabase = ensureSupabaseAdmin();
  const startedAt = input.startedAt ?? format(new Date(), "yyyy-MM-dd");
  const renewalDate = input.renewalDate ?? getNextRenewalDate(startedAt, input.plan);
  const provider = input.provider ?? (input.stripeSubscriptionId ? "stripe" : "admin");

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: input.plan,
        status: input.status,
        provider,
        amount_cents: planCatalog[input.plan].priceCents,
        started_at: startedAt,
        renewal_date: renewalDate,
        canceled_at: input.canceledAt ?? (input.status === "canceled" ? startedAt : null),
        stripe_subscription_id: input.stripeSubscriptionId ?? null,
        stripe_price_id: input.stripePriceId ?? null,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (input.stripeCustomerId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: input.stripeCustomerId, updated_at: getIsoNow() })
      .eq("id", userId);

    if (profileError) {
      throw profileError;
    }
  }

  await insertNotification({
    type: "subscription",
    channel: "system",
    userId,
    subject: "Subscription updated",
    preview: `Plan switched to ${input.plan} and marked ${input.status}.`,
    status: "sent",
  });

  return mapSubscription(data);
}

export async function createCharity(input: { name: string; location: string; headline: string; summary: string }) {
  const supabase = ensureSupabaseAdmin();
  const payload = {
    id: randomUUID(),
    slug: slugify(input.name),
    name: input.name,
    location: input.location,
    headline: input.headline,
    summary: input.summary,
    mission: input.summary,
    image_gradient: "from-sky-500 via-cyan-500 to-emerald-500",
    featured: false,
    tags: ["Community"],
    events: [],
  };

  const { error } = await supabase.from("charities").insert(payload);

  if (error) {
    throw error;
  }

  await insertAuditLog({
    actorUserId: null,
    entityType: "charity",
    entityId: payload.id,
    action: "charity_created",
    detail: `Added charity ${input.name}.`,
  });
}

export async function reviewClaim(
  claimId: string,
  input: { reviewStatus: ReviewStatus; paymentStatus: WinnerClaim["paymentStatus"]; notes: string },
) {
  const supabase = ensureSupabaseAdmin();
  const { data: claimRow, error: claimError } = await supabase.from("winner_claims").select("*").eq("id", claimId).single();

  if (claimError) {
    throw claimError;
  }

  const claim = mapClaim(claimRow);
  const { error: updateError } = await supabase
    .from("winner_claims")
    .update({ review_status: input.reviewStatus, payment_status: input.paymentStatus, notes: input.notes })
    .eq("id", claimId);

  if (updateError) {
    throw updateError;
  }

  const { data: drawRow, error: drawError } = await supabase.from("draws").select("*").eq("id", claim.drawId).single();

  if (drawError) {
    throw drawError;
  }

  const draw = mapDraw(drawRow);
  const winners = draw.winners.map((winner) =>
    winner.userId === claim.userId && draw.id === claim.drawId
      ? { ...winner, status: input.paymentStatus }
      : winner,
  );

  const { error: drawUpdateError } = await supabase.from("draws").update({ winners }).eq("id", draw.id);

  if (drawUpdateError) {
    throw drawUpdateError;
  }

  const user = await getUserById(claim.userId);
  if (user) {
    await sendPlatformEmail({
      to: user.email,
      subject: "Your claim review has been updated",
      html: `<p>${input.notes}</p>`,
    });
  }

  await Promise.all([
    insertNotification({
      type: "winner",
      channel: "system",
      userId: claim.userId,
      subject: "Winner claim reviewed",
      preview: input.notes,
      status: "sent",
    }),
    insertAuditLog({
      actorUserId: null,
      entityType: "claim",
      entityId: claimId,
      action: "claim_reviewed",
      detail: `${input.reviewStatus}/${input.paymentStatus}: ${input.notes}`,
    }),
  ]);
}

export async function runDraw(mode: DrawMode, shouldPublish: boolean) {
  const supabase = ensureSupabaseAdmin();
  const [subscriptionsResult, scoresResult, previousDrawResult] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("status", "active"),
    supabase.from("scores").select("*").order("played_at", { ascending: false }),
    supabase.from("draws").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(1),
  ]);

  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (scoresResult.error) throw scoresResult.error;
  if (previousDrawResult.error) throw previousDrawResult.error;

  const activeSubscriptions = (subscriptionsResult.data ?? []).map((row) => mapSubscription(row));
  const participantUserIds = activeSubscriptions.map((subscription) => subscription.userId);
  const participantScores = (scoresResult.data ?? []).map((row) => mapScore(row)).filter((score) => participantUserIds.includes(score.userId));
  const previousPublishedDraw = previousDrawResult.data?.[0] ? mapDraw(previousDrawResult.data[0]) : null;
  const rolloverCents = previousPublishedDraw
    ? previousPublishedDraw.winners.some((winner) => winner.matchTier === 5)
      ? 0
      : previousPublishedDraw.rolloverCents
    : 0;
  const winningNumbers = generateWinningNumbers(mode, participantScores);
  const prizePoolCents = getPrizePoolCents(activeSubscriptions, rolloverCents);

  const winners = participantUserIds
    .map((userId) => {
      const numbers = keepLatestScores(participantScores.filter((score) => score.userId === userId)).map((score) => score.value);
      const matchTier = getMatchTier(winningNumbers, numbers);
      return matchTier ? { userId, matchTier } : null;
    })
    .filter(Boolean) as Array<{ userId: string; matchTier: MatchTier }>;

  const winnersWithPrizes = winners.map((winner) => {
    const tierWinnerCount = winners.filter((entry) => entry.matchTier === winner.matchTier).length;
    const tierShare = winner.matchTier === 5 ? 0.4 : winner.matchTier === 4 ? 0.35 : 0.25;

    return {
      userId: winner.userId,
      matchTier: winner.matchTier,
      prizeCents: tierWinnerCount === 0 ? 0 : Math.round((prizePoolCents * tierShare) / tierWinnerCount),
      status: shouldPublish ? "pending" : "processing",
    } satisfies DrawRun["winners"][number];
  });

  const { data, error } = await supabase
    .from("draws")
    .insert({
      id: randomUUID(),
      month_key: format(new Date(), "yyyy-MM"),
      label: format(new Date(), "MMMM yyyy"),
      mode,
      status: shouldPublish ? "published" : "simulated",
      winning_numbers: winningNumbers,
      active_subscriber_count: activeSubscriptions.length,
      prize_pool_cents: prizePoolCents,
      rollover_cents: winnersWithPrizes.some((winner) => winner.matchTier === 5) ? 0 : Math.round(prizePoolCents * 0.4),
      winners: winnersWithPrizes,
      published_at: shouldPublish ? getIsoNow() : null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const draw = mapDraw(data);

  if (shouldPublish) {
    const notifications = participantUserIds.map((userId) => ({
      id: randomUUID(),
      type: "draw",
      channel: "system",
      subject: `Draw results for ${draw.label}`,
      preview: `Winning numbers: ${draw.winningNumbers.join(", ")}`,
      user_id: userId,
      status: "sent",
    }));

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase.from("notifications").insert(notifications);

      if (notificationError) {
        logError("draw.notification_insert_failed", {
          message: notificationError.message,
          drawId: draw.id,
        });
      }
    }
  }

  await insertAuditLog({
    actorUserId: null,
    entityType: "draw",
    entityId: draw.id,
    action: shouldPublish ? "draw_published" : "draw_simulated",
    detail: `${mode} draw processed for ${draw.label}.`,
  });

  return draw;
}

export async function syncStripeCheckoutCompleted(input: {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  priceId: string | null;
  plan: SubscriptionPlan;
}) {
  const startedAt = format(new Date(), "yyyy-MM-dd");

  return createOrUpdateSubscription(input.userId, {
    plan: input.plan,
    status: "active",
    provider: "stripe",
    stripeSubscriptionId: input.subscriptionId,
    stripePriceId: input.priceId,
    stripeCustomerId: input.customerId,
    startedAt,
    renewalDate: getNextRenewalDate(startedAt, input.plan),
  });
}

export async function syncStripeSubscription(input: {
  userId: string;
  customerId: string | null;
  subscriptionId: string;
  priceId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string;
  renewalDate: string;
  canceledAt?: string | null;
}) {
  return createOrUpdateSubscription(input.userId, {
    plan: input.plan,
    status: input.status,
    provider: "stripe",
    stripeSubscriptionId: input.subscriptionId,
    stripePriceId: input.priceId,
    stripeCustomerId: input.customerId,
    startedAt: input.startedAt,
    renewalDate: input.renewalDate,
    canceledAt: input.canceledAt ?? null,
  });
}

export async function findUserIdByStripeCustomerId(customerId: string) {
  if (!appConfig.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? String(data.id) : null;
}

export async function getUserBillingDetails(userId: string) {
  const [user, subscription] = await Promise.all([getUserById(userId), getUserSubscription(userId)]);

  return {
    user,
    subscription,
  };
}

export async function publishScheduledDraw(mode: DrawMode = "random") {
  const supabase = ensureSupabaseAdmin();
  const monthKey = format(new Date(), "yyyy-MM");
  const { data, error } = await supabase.from("draws").select("id").eq("month_key", monthKey).eq("status", "published").maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return { status: "skipped" as const, reason: "already_published" as const };
  }

  const draw = await runDraw(mode, true);
  return { status: "published" as const, draw };
}

export async function pingSupabaseHealth() {
  if (!appConfig.hasSupabaseAdmin) {
    return { ok: false as const, reason: "missing_env" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("charities").select("id").limit(1);

    if (error) {
      throw error;
    }

    logInfo("supabase.health.ok");
    return { ok: true as const };
  } catch (error) {
    logError("supabase.health.failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { ok: false as const, reason: "query_failed" as const };
  }
}

