import {
  addMonths,
  compareDesc,
  format,
  isSameMonth,
  parseISO,
} from "date-fns";

import { appConfig, drawTierShares, planCatalog } from "@/lib/config";
import type {
  DrawMode,
  DrawRun,
  MatchTier,
  ScoreEntry,
  Subscription,
  User,
} from "@/lib/types";

export function sortScoresLatestFirst(scores: ScoreEntry[]) {
  return [...scores].sort((left, right) => {
    const playedComparison = compareDesc(
      parseISO(left.playedAt),
      parseISO(right.playedAt),
    );

    if (playedComparison !== 0) {
      return playedComparison;
    }

    return compareDesc(parseISO(left.createdAt), parseISO(right.createdAt));
  });
}

export function keepLatestScores(scores: ScoreEntry[]) {
  return sortScoresLatestFirst(scores).slice(0, appConfig.maxScoresPerUser);
}

export function getUserDrawNumbers(scores: ScoreEntry[]) {
  return keepLatestScores(scores).map((score) => score.value);
}

function buildWeightedPool(values: number[], mode: DrawMode) {
  const counts = new Map<number, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from({ length: appConfig.scoreRange.max }, (_, index) => {
    const score = index + 1;
    const frequency = counts.get(score) ?? 0;
    const weight =
      mode === "hot"
        ? Math.max(1, frequency * 3)
        : mode === "cold"
          ? Math.max(1, counts.size === 0 ? 1 : 6 - Math.min(frequency, 5))
          : 1;

    return {
      score,
      weight,
    };
  });
}

function pickUniqueNumbers(mode: DrawMode, sourceValues: number[]) {
  const weightedPool = buildWeightedPool(sourceValues, mode);
  const selected: number[] = [];

  while (selected.length < appConfig.maxScoresPerUser) {
    const remaining = weightedPool.filter(
      (candidate) => !selected.includes(candidate.score),
    );
    const totalWeight = remaining.reduce(
      (sum, candidate) => sum + candidate.weight,
      0,
    );
    let threshold = Math.random() * totalWeight;

    for (const candidate of remaining) {
      threshold -= candidate.weight;

      if (threshold <= 0) {
        selected.push(candidate.score);
        break;
      }
    }
  }

  return selected.sort((left, right) => left - right);
}

export function generateWinningNumbers(
  mode: DrawMode,
  activeScores: ScoreEntry[],
) {
  return pickUniqueNumbers(mode, activeScores.map((score) => score.value));
}

export function getMatchTier(
  winningNumbers: number[],
  playerNumbers: number[],
): MatchTier | null {
  const matches = playerNumbers.filter((number) =>
    winningNumbers.includes(number),
  ).length;

  if (matches >= 5) return 5;
  if (matches === 4) return 4;
  if (matches === 3) return 3;
  return null;
}

export function getMonthlyEquivalentCents(subscription: Subscription) {
  const plan = planCatalog[subscription.plan];
  return Math.round(subscription.amountCents / plan.cycleMonths);
}

export function getPrizePoolCents(
  subscriptions: Subscription[],
  rolloverCents = 0,
) {
  const monthlyRevenue = subscriptions.reduce(
    (sum, subscription) => sum + getMonthlyEquivalentCents(subscription),
    0,
  );

  return (
    Math.round(monthlyRevenue * (appConfig.prizePoolPercentage / 100)) +
    rolloverCents
  );
}

export function getPrizeTierCents(prizePoolCents: number, tier: MatchTier) {
  return Math.round(prizePoolCents * drawTierShares[tier]);
}

export function getNextRenewalDate(
  startedAt: string,
  plan: Subscription["plan"],
) {
  return format(
    addMonths(parseISO(startedAt), planCatalog[plan].cycleMonths),
    "yyyy-MM-dd",
  );
}

export function getUpcomingDrawLabel(referenceDate = new Date()) {
  return format(referenceDate, "MMMM yyyy");
}

export function hasUserEnteredDraw(draw: DrawRun, userId: string) {
  return draw.winners.some((winner) => winner.userId === userId);
}

export function getCurrentMonthDraw(
  draws: DrawRun[],
  referenceDate = new Date(),
) {
  return draws.find((draw) =>
    isSameMonth(parseISO(`${draw.monthKey}-01`), referenceDate),
  );
}

export function getAnalytics(
  users: User[],
  subscriptions: Subscription[],
  draws: DrawRun[],
) {
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active",
  );
  const totalPrizePool = draws.reduce(
    (sum, draw) => sum + draw.prizePoolCents,
    0,
  );
  const totalPaid = draws.reduce(
    (sum, draw) =>
      sum +
      draw.winners
        .filter((winner) => winner.status === "paid")
        .reduce((tierSum, winner) => tierSum + winner.prizeCents, 0),
    0,
  );

  return {
    totalUsers: users.length,
    activeSubscribers: activeSubscriptions.length,
    totalPrizePool,
    totalPaid,
  };
}

