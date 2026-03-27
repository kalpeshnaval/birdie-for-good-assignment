import { z } from "zod";

export const planCatalog = {
  monthly: {
    id: "monthly",
    name: "Monthly",
    priceCents: 2900,
    cycleMonths: 1,
    summary: "Flexible access with monthly draw entry and charity support.",
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    priceCents: 29000,
    cycleMonths: 12,
    summary: "Best value with a lower effective monthly rate and uninterrupted access.",
  },
} as const;

export const drawTierShares = {
  5: 0.4,
  4: 0.35,
  3: 0.25,
} as const;

export const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(16).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_YEARLY_PRICE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

const parsedEnv = appEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID,
  STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
});

export const appConfig = {
  appName: "Birdie for Good",
  appUrl: parsedEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  sessionSecret:
    parsedEnv.SESSION_SECRET ??
    "development-session-secret-change-me-before-production",
  defaultCharityPercentage: 10,
  minimumCharityPercentage: 10,
  prizePoolPercentage: 35,
  scoreRange: {
    min: 1,
    max: 45,
  },
  maxScoresPerUser: 5,
  hasStripe:
    Boolean(parsedEnv.STRIPE_SECRET_KEY) &&
    Boolean(parsedEnv.STRIPE_MONTHLY_PRICE_ID) &&
    Boolean(parsedEnv.STRIPE_YEARLY_PRICE_ID),
  hasEmail: Boolean(parsedEnv.RESEND_API_KEY) && Boolean(parsedEnv.EMAIL_FROM),
  stripeSecretKey: parsedEnv.STRIPE_SECRET_KEY,
  stripeMonthlyPriceId: parsedEnv.STRIPE_MONTHLY_PRICE_ID,
  stripeYearlyPriceId: parsedEnv.STRIPE_YEARLY_PRICE_ID,
  resendApiKey: parsedEnv.RESEND_API_KEY,
  emailFrom: parsedEnv.EMAIL_FROM,
} as const;

export const demoCredentials = {
  admin: {
    email: "admin@golfcharity.local",
    password: "Admin123!",
  },
  subscriber: {
    email: "player@golfcharity.local",
    password: "Player123!",
  },
} as const;

