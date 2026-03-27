import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { compareDesc, format, parseISO } from "date-fns";

import { appConfig, demoCredentials, planCatalog } from "@/lib/config";
import {
  generateWinningNumbers,
  getMatchTier,
  getMonthlyEquivalentCents,
  getNextRenewalDate,
  getPrizePoolCents,
  keepLatestScores,
} from "@/lib/draws";
import { hashPassword } from "@/lib/hash";
import type {
  Charity,
  DashboardSnapshot,
  DemoState,
  DrawMode,
  DrawRun,
  MatchTier,
  ReviewStatus,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  SystemNotification,
  User,
  WinnerClaim,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "demo-store.json");
const uploadsDirectory = path.join(dataDirectory, "proofs");

let writeQueue = Promise.resolve();

const seededCharities: Charity[] = [
  {
    id: "charity-river",
    slug: "river-reset",
    name: "River Reset",
    location: "Austin, Texas",
    headline: "Restoring urban waterways through youth-led cleanups.",
    summary:
      "River Reset funds cleanup crews, school workshops, and weekend restoration projects around city water systems.",
    mission:
      "The charity turns every member contribution into visible, local environmental action with volunteer programs and educational events.",
    imageGradient: "from-emerald-400 via-teal-500 to-cyan-600",
    featured: true,
    tags: ["Environment", "Youth", "Community"],
    events: [
      {
        id: "river-event-1",
        title: "Spring Charity Scramble",
        location: "Barton Creek",
        date: "2026-04-19",
      },
    ],
  },
  {
    id: "charity-caddie",
    slug: "caddie-futures",
    name: "Caddie Futures",
    location: "Scottsdale, Arizona",
    headline: "Opening pathways into sport, study, and leadership.",
    summary:
      "Caddie Futures supports scholarships, mentorship, and equipment access for underrepresented young golfers.",
    mission:
      "The organization helps talented young players gain confidence, experience, and better opportunities on and off the course.",
    imageGradient: "from-amber-400 via-orange-500 to-rose-500",
    featured: true,
    tags: ["Education", "Sport", "Mentorship"],
    events: [
      {
        id: "caddie-event-1",
        title: "Scholarship Invitational",
        location: "Troon North",
        date: "2026-05-04",
      },
    ],
  },
  {
    id: "charity-heart",
    slug: "hearts-on-course",
    name: "Hearts on Course",
    location: "St Andrews, Scotland",
    headline: "Creating calm, outdoor moments for families facing illness.",
    summary:
      "Hearts on Course helps families access respite retreats, counseling, and supportive community experiences.",
    mission:
      "By pairing fundraising with meaningful storytelling, the charity creates tangible emotional support for households under pressure.",
    imageGradient: "from-fuchsia-500 via-pink-500 to-orange-400",
    featured: true,
    tags: ["Health", "Families", "Wellbeing"],
    events: [
      {
        id: "heart-event-1",
        title: "Evening Impact Dinner",
        location: "Old Course Hotel",
        date: "2026-06-12",
      },
    ],
  },
];

function getIsoNow() {
  return new Date().toISOString();
}

async function ensureDemoState() {
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(uploadsDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    const now = getIsoNow();
    const adminUserId = "user-admin";
    const playerUserId = "user-player";
    const starterScores: Array<[number, string]> = [
      [35, "2026-03-01"],
      [37, "2026-03-05"],
      [31, "2026-03-10"],
      [39, "2026-03-15"],
      [33, "2026-03-21"],
    ];

    const initialState: DemoState = {
      users: [
        {
          id: adminUserId,
          name: "Admin Captain",
          email: demoCredentials.admin.email,
          passwordHash: hashPassword(demoCredentials.admin.password),
          role: "admin",
          createdAt: now,
          selectedCharityId: "charity-caddie",
          charityPercentage: 15,
          avatarSeed: "admin-captain",
        },
        {
          id: playerUserId,
          name: "Avery Stone",
          email: demoCredentials.subscriber.email,
          passwordHash: hashPassword(demoCredentials.subscriber.password),
          role: "subscriber",
          createdAt: now,
          selectedCharityId: "charity-river",
          charityPercentage: appConfig.defaultCharityPercentage,
          avatarSeed: "avery-stone",
        },
      ],
      subscriptions: [
        {
          id: "subscription-player",
          userId: playerUserId,
          plan: "yearly",
          status: "active",
          provider: "demo",
          amountCents: planCatalog.yearly.priceCents,
          startedAt: "2026-01-10",
          renewalDate: "2027-01-10",
        },
      ],
      charities: seededCharities,
      scores: starterScores.map(([value, playedAt], index) => ({
        id: `score-${index + 1}`,
        userId: playerUserId,
        value,
        playedAt,
        createdAt: now,
        updatedAt: now,
      })),
      draws: [],
      claims: [],
      notifications: [],
    };

    await writeFile(storePath, JSON.stringify(initialState, null, 2), "utf8");
  }
}

async function readState() {
  await ensureDemoState();
  const file = await readFile(storePath, "utf8");
  return JSON.parse(file) as DemoState;
}

function persistState(state: DemoState) {
  writeQueue = writeQueue.then(() =>
    writeFile(storePath, JSON.stringify(state, null, 2), "utf8"),
  );
  return writeQueue;
}

function addNotification(
  state: DemoState,
  notification: Omit<SystemNotification, "id" | "createdAt">,
) {
  state.notifications.unshift({
    id: nanoid(),
    createdAt: getIsoNow(),
    ...notification,
  });
}

function getSubscriptionForUser(state: DemoState, userId: string) {
  return (
    [...state.subscriptions]
      .filter((subscription) => subscription.userId === userId)
      .sort((left, right) =>
        compareDesc(parseISO(left.startedAt), parseISO(right.startedAt)),
      )[0] ?? null
  );
}

function getLatestPublishedDraw(state: DemoState) {
  return (
    [...state.draws]
      .filter((draw) => draw.status === "published")
      .sort((left, right) =>
        compareDesc(parseISO(left.createdAt), parseISO(right.createdAt)),
      )[0] ?? null
  );
}

export async function listCharities() {
  const state = await readState();
  return state.charities;
}

export async function getPublicSnapshot() {
  const state = await readState();
  const activeSubscriptions = state.subscriptions.filter(
    (subscription) => subscription.status === "active",
  );
  const totalRaisedCents = activeSubscriptions.reduce((sum, subscription) => {
    const user = state.users.find((entry) => entry.id === subscription.userId);
    const monthlyEquivalent = getMonthlyEquivalentCents(subscription);
    return (
      sum +
      Math.round(monthlyEquivalent * ((user?.charityPercentage ?? 0) / 100))
    );
  }, 0);

  return {
    featuredCharities: state.charities.filter((charity) => charity.featured),
    subscriberCount: activeSubscriptions.length,
    totalRaisedCents,
    latestDraw: getLatestPublishedDraw(state),
  };
}

export async function getCharityBySlug(slug: string) {
  const state = await readState();
  return state.charities.find((charity) => charity.slug === slug) ?? null;
}

export async function findUserByEmail(email: string) {
  const state = await readState();
  return (
    state.users.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
    ) ?? null
  );
}

export async function getUserById(userId: string) {
  const state = await readState();
  return state.users.find((user) => user.id === userId) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  plan: SubscriptionPlan;
  charityId: string;
  charityPercentage: number;
}) {
  const state = await readState();
  const existingUser = state.users.find(
    (user) => user.email.toLowerCase() === input.email.toLowerCase(),
  );

  if (existingUser) {
    throw new Error("An account with that email already exists.");
  }

  const now = getIsoNow();
  const userId = nanoid();
  const subscriptionId = nanoid();
  const startedAt = format(new Date(), "yyyy-MM-dd");

  const user: User = {
    id: userId,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    role: "subscriber",
    createdAt: now,
    selectedCharityId: input.charityId,
    charityPercentage: input.charityPercentage,
    avatarSeed: input.name.toLowerCase().replace(/\s+/g, "-"),
  };

  const subscription: Subscription = {
    id: subscriptionId,
    userId,
    plan: input.plan,
    status: "active",
    provider: "demo",
    amountCents: planCatalog[input.plan].priceCents,
    startedAt,
    renewalDate: getNextRenewalDate(startedAt, input.plan),
  };

  state.users.push(user);
  state.subscriptions.push(subscription);
  addNotification(state, {
    type: "signup",
    channel: "system",
    userId,
    subject: "Welcome to Birdie for Good",
    preview: `${user.name} joined on the ${input.plan} plan.`,
    status: "sent",
  });

  await persistState(state);
  return user;
}

export async function getDashboardSnapshot(
  userId: string,
): Promise<DashboardSnapshot | null> {
  const state = await readState();
  const user = state.users.find((entry) => entry.id === userId);

  if (!user) {
    return null;
  }

  const subscription = getSubscriptionForUser(state, userId);
  const selectedCharity =
    state.charities.find((charity) => charity.id === user.selectedCharityId) ??
    state.charities[0];
  const scores = keepLatestScores(
    state.scores.filter((score) => score.userId === userId),
  );
  const draws = [...state.draws].sort((left, right) =>
    compareDesc(parseISO(left.createdAt), parseISO(right.createdAt)),
  );
  const pendingClaim =
    state.claims.find(
      (claim) =>
        claim.userId === userId &&
        (claim.reviewStatus === "pending" || claim.paymentStatus !== "paid"),
    ) ?? null;
  const winningsCents = draws.reduce(
    (sum, draw) =>
      sum +
      draw.winners
        .filter((winner) => winner.userId === userId)
        .reduce((winnerSum, winner) => winnerSum + winner.prizeCents, 0),
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

export async function addScore(
  userId: string,
  input: {
    value: number;
    playedAt: string;
  },
) {
  const state = await readState();
  const now = getIsoNow();
  const nextScores = keepLatestScores([
    ...state.scores.filter((score) => score.userId === userId),
    {
      id: nanoid(),
      userId,
      value: input.value,
      playedAt: input.playedAt,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  state.scores = [
    ...state.scores.filter((score) => score.userId !== userId),
    ...nextScores,
  ];

  await persistState(state);
}

export async function updateScore(
  userId: string,
  input: {
    scoreId: string;
    value: number;
    playedAt: string;
  },
) {
  const state = await readState();

  state.scores = state.scores.map((score) =>
    score.id === input.scoreId && score.userId === userId
      ? {
          ...score,
          value: input.value,
          playedAt: input.playedAt,
          updatedAt: getIsoNow(),
        }
      : score,
  );

  const normalized = keepLatestScores(
    state.scores.filter((score) => score.userId === userId),
  );

  state.scores = [
    ...state.scores.filter((score) => score.userId !== userId),
    ...normalized,
  ];

  await persistState(state);
}

export async function updateCharityPreference(
  userId: string,
  input: {
    charityId: string;
    charityPercentage: number;
  },
) {
  const state = await readState();
  state.users = state.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          selectedCharityId: input.charityId,
          charityPercentage: input.charityPercentage,
        }
      : user,
  );

  await persistState(state);
}

export async function submitClaim(
  userId: string,
  input: {
    drawId: string;
    fileName: string;
  },
) {
  const state = await readState();
  const existingClaim = state.claims.find(
    (claim) => claim.drawId === input.drawId && claim.userId === userId,
  );

  if (existingClaim) {
    throw new Error("A verification proof already exists for this draw.");
  }

  const claim: WinnerClaim = {
    id: nanoid(),
    drawId: input.drawId,
    userId,
    proofId: nanoid(),
    fileName: input.fileName,
    submittedAt: getIsoNow(),
    reviewStatus: "pending",
    paymentStatus: "pending",
    notes: "Awaiting admin review.",
  };

  state.claims.unshift(claim);
  addNotification(state, {
    type: "proof",
    channel: "system",
    userId,
    subject: "Winner proof submitted",
    preview: `${input.fileName} is ready for admin review.`,
    status: "sent",
  });

  await persistState(state);
  return claim;
}

export async function saveProofFile(
  proofId: string,
  fileName: string,
  bytes: Uint8Array,
) {
  await ensureDemoState();
  const target = path.join(uploadsDirectory, `${proofId}-${fileName}`);
  await writeFile(target, bytes);
  return target;
}

export async function getProofFilePath(proofId: string) {
  await ensureDemoState();
  const state = await readState();
  const claim = state.claims.find((entry) => entry.proofId === proofId);

  if (!claim) {
    return null;
  }

  return path.join(uploadsDirectory, `${claim.proofId}-${claim.fileName}`);
}

export async function getAdminSnapshot() {
  const state = await readState();
  const activeSubscriptions = state.subscriptions.filter(
    (subscription) => subscription.status === "active",
  );

  const totalCharityContribution = activeSubscriptions.reduce(
    (sum, subscription) => {
      const user = state.users.find((entry) => entry.id === subscription.userId);
      const monthlyEquivalent = getMonthlyEquivalentCents(subscription);
      return (
        sum +
        Math.round(monthlyEquivalent * ((user?.charityPercentage ?? 0) / 100))
      );
    },
    0,
  );

  return {
    users: state.users,
    subscriptions: state.subscriptions,
    charities: state.charities,
    scores: state.scores,
    draws: state.draws,
    claims: state.claims,
    notifications: state.notifications.slice(0, 8),
    analytics: {
      totalUsers: state.users.length,
      activeSubscribers: activeSubscriptions.length,
      totalPrizePool: state.draws.reduce(
        (sum, draw) => sum + draw.prizePoolCents,
        0,
      ),
      totalCharityContribution,
      drawCount: state.draws.length,
    },
  };
}

export async function createOrUpdateSubscription(
  userId: string,
  input: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
  },
) {
  const state = await readState();
  const existing = getSubscriptionForUser(state, userId);
  const startedAt = format(new Date(), "yyyy-MM-dd");
  const nextSubscription: Subscription = {
    id: existing?.id ?? nanoid(),
    userId,
    plan: input.plan,
    status: input.status,
    provider: "demo",
    amountCents: planCatalog[input.plan].priceCents,
    startedAt,
    renewalDate: getNextRenewalDate(startedAt, input.plan),
    canceledAt: input.status === "canceled" ? startedAt : undefined,
  };

  state.subscriptions = [
    ...state.subscriptions.filter((subscription) => subscription.userId !== userId),
    nextSubscription,
  ];

  addNotification(state, {
    type: "subscription",
    channel: "system",
    userId,
    subject: "Subscription updated",
    preview: `Plan switched to ${input.plan} and marked ${input.status}.`,
    status: "sent",
  });

  await persistState(state);
}

export async function createCharity(input: {
  name: string;
  location: string;
  headline: string;
  summary: string;
}) {
  const state = await readState();
  state.charities.unshift({
    id: nanoid(),
    slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: input.name,
    location: input.location,
    headline: input.headline,
    summary: input.summary,
    mission: input.summary,
    imageGradient: "from-sky-500 via-cyan-500 to-emerald-500",
    featured: false,
    tags: ["Community"],
    events: [],
  });

  await persistState(state);
}

export async function reviewClaim(
  claimId: string,
  input: {
    reviewStatus: ReviewStatus;
    paymentStatus: WinnerClaim["paymentStatus"];
    notes: string;
  },
) {
  const state = await readState();
  const claim = state.claims.find((entry) => entry.id === claimId);

  if (!claim) {
    throw new Error("Claim not found.");
  }

  claim.reviewStatus = input.reviewStatus;
  claim.paymentStatus = input.paymentStatus;
  claim.notes = input.notes;

  state.draws = state.draws.map((draw) => ({
    ...draw,
    winners: draw.winners.map((winner) =>
      winner.userId === claim.userId &&
      winner.status !== "paid" &&
      draw.id === claim.drawId
        ? {
            ...winner,
            status: input.paymentStatus,
          }
        : winner,
    ),
  }));

  addNotification(state, {
    type: "winner",
    channel: "system",
    userId: claim.userId,
    subject: "Winner claim reviewed",
    preview: input.notes,
    status: "sent",
  });

  await persistState(state);
}

export async function runDraw(mode: DrawMode, shouldPublish: boolean) {
  const state = await readState();
  const activeSubscriptions = state.subscriptions.filter(
    (subscription) => subscription.status === "active",
  );
  const participantUserIds = activeSubscriptions.map(
    (subscription) => subscription.userId,
  );
  const participantScores = state.scores.filter((score) =>
    participantUserIds.includes(score.userId),
  );
  const previousPublishedDraw = getLatestPublishedDraw(state);
  const rolloverCents = previousPublishedDraw
    ? previousPublishedDraw.winners.some((winner) => winner.matchTier === 5)
      ? 0
      : previousPublishedDraw.rolloverCents
    : 0;
  const winningNumbers = generateWinningNumbers(mode, participantScores);
  const prizePoolCents = getPrizePoolCents(activeSubscriptions, rolloverCents);

  const winners = participantUserIds
    .map((userId) => {
      const numbers = keepLatestScores(
        participantScores.filter((score) => score.userId === userId),
      ).map((score) => score.value);
      const matchTier = getMatchTier(winningNumbers, numbers);

      return matchTier
        ? {
            userId,
            matchTier,
          }
        : null;
    })
    .filter(Boolean) as Array<{ userId: string; matchTier: MatchTier }>;

  const winnersWithPrizes = winners.map((winner) => {
    const tierWinnerCount = winners.filter(
      (entry) => entry.matchTier === winner.matchTier,
    ).length;
    const tierShare =
      winner.matchTier === 5 ? 0.4 : winner.matchTier === 4 ? 0.35 : 0.25;

    return {
      userId: winner.userId,
      matchTier: winner.matchTier,
      prizeCents:
        tierWinnerCount === 0
          ? 0
          : Math.round((prizePoolCents * tierShare) / tierWinnerCount),
      status: shouldPublish ? "pending" : "processing",
    } satisfies DrawRun["winners"][number];
  });

  const draw: DrawRun = {
    id: nanoid(),
    monthKey: format(new Date(), "yyyy-MM"),
    label: format(new Date(), "MMMM yyyy"),
    mode,
    status: shouldPublish ? "published" : "simulated",
    winningNumbers,
    activeSubscriberCount: activeSubscriptions.length,
    prizePoolCents,
    rolloverCents: winnersWithPrizes.some((winner) => winner.matchTier === 5)
      ? 0
      : Math.round(prizePoolCents * 0.4),
    winners: winnersWithPrizes.sort((left, right) => right.matchTier - left.matchTier),
    publishedAt: shouldPublish ? getIsoNow() : undefined,
    createdAt: getIsoNow(),
  };

  state.draws.unshift(draw);

  if (shouldPublish) {
    for (const userId of participantUserIds) {
      addNotification(state, {
        type: "draw",
        channel: "system",
        userId,
        subject: `Draw results for ${draw.label}`,
        preview: `Winning numbers: ${draw.winningNumbers.join(", ")}`,
        status: "sent",
      });
    }
  }

  await persistState(state);
  return draw;
}
