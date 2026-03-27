export type UserRole = "subscriber" | "admin";

export type SubscriptionPlan = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "canceled"
  | "past_due";

export type DrawMode = "random" | "hot" | "cold";

export type DrawStatus = "draft" | "simulated" | "published";

export type MatchTier = 3 | 4 | 5;

export type ReviewStatus = "pending" | "approved" | "rejected";

export type PaymentStatus = "pending" | "processing" | "paid" | "rejected";

export type NotificationType =
  | "signup"
  | "subscription"
  | "draw"
  | "winner"
  | "proof";

export type SystemNotification = {
  id: string;
  type: NotificationType;
  channel: "email" | "system";
  subject: string;
  preview: string;
  userId?: string;
  createdAt: string;
  status: "sent" | "skipped";
};

export type CharityEvent = {
  id: string;
  title: string;
  location: string;
  date: string;
};

export type Charity = {
  id: string;
  slug: string;
  name: string;
  location: string;
  headline: string;
  summary: string;
  mission: string;
  imageGradient: string;
  featured: boolean;
  tags: string[];
  events: CharityEvent[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  selectedCharityId: string;
  charityPercentage: number;
  avatarSeed: string;
};

export type Subscription = {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: "demo" | "stripe";
  amountCents: number;
  startedAt: string;
  renewalDate: string;
  canceledAt?: string;
};

export type ScoreEntry = {
  id: string;
  userId: string;
  value: number;
  playedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DrawWinner = {
  userId: string;
  matchTier: MatchTier;
  prizeCents: number;
  status: PaymentStatus;
};

export type DrawRun = {
  id: string;
  monthKey: string;
  label: string;
  mode: DrawMode;
  status: DrawStatus;
  winningNumbers: number[];
  activeSubscriberCount: number;
  prizePoolCents: number;
  rolloverCents: number;
  winners: DrawWinner[];
  publishedAt?: string;
  createdAt: string;
};

export type WinnerClaim = {
  id: string;
  drawId: string;
  userId: string;
  proofId: string;
  fileName: string;
  submittedAt: string;
  reviewStatus: ReviewStatus;
  paymentStatus: PaymentStatus;
  notes: string;
};

export type DemoState = {
  users: User[];
  subscriptions: Subscription[];
  charities: Charity[];
  scores: ScoreEntry[];
  draws: DrawRun[];
  claims: WinnerClaim[];
  notifications: SystemNotification[];
};

export type SessionUser = {
  userId: string;
  role: UserRole;
};

export type DashboardSnapshot = {
  user: User;
  subscription: Subscription | null;
  selectedCharity: Charity;
  scores: ScoreEntry[];
  draws: DrawRun[];
  pendingClaim: WinnerClaim | null;
  winningsCents: number;
};

