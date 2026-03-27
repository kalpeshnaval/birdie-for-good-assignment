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
    summary:
      "Best value with a lower effective monthly rate and uninterrupted access.",
  },
} as const;

export const drawTierShares = {
  5: 0.4,
  4: 0.35,
  3: 0.25,
} as const;

export const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_PROOFS_BUCKET: z.string().optional(),
  PLATFORM_ADMIN_EMAILS: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_YEARLY_PRICE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  CRON_SECRET: z.string().optional(),
});

const parsedEnv = appEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_PROOFS_BUCKET: process.env.SUPABASE_PROOFS_BUCKET,
  PLATFORM_ADMIN_EMAILS: process.env.PLATFORM_ADMIN_EMAILS,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID,
  STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  CRON_SECRET: process.env.CRON_SECRET,
});

const adminEmails = (parsedEnv.PLATFORM_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export const appConfig = {
  appName: "Birdie for Good",
  appUrl: parsedEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultCharityPercentage: 10,
  minimumCharityPercentage: 10,
  prizePoolPercentage: 35,
  scoreRange: {
    min: 1,
    max: 45,
  },
  maxScoresPerUser: 5,
  adminEmails,
  supabaseUrl: parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  proofsBucket: parsedEnv.SUPABASE_PROOFS_BUCKET ?? "winner-proofs",
  hasSupabase:
    Boolean(parsedEnv.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  hasSupabaseAdmin:
    Boolean(parsedEnv.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
    Boolean(parsedEnv.SUPABASE_SERVICE_ROLE_KEY),
  stripeSecretKey: parsedEnv.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnv.STRIPE_WEBHOOK_SECRET,
  stripeMonthlyPriceId: parsedEnv.STRIPE_MONTHLY_PRICE_ID,
  stripeYearlyPriceId: parsedEnv.STRIPE_YEARLY_PRICE_ID,
  hasStripeCheckout:
    Boolean(parsedEnv.STRIPE_SECRET_KEY) &&
    Boolean(parsedEnv.STRIPE_MONTHLY_PRICE_ID) &&
    Boolean(parsedEnv.STRIPE_YEARLY_PRICE_ID),
  hasStripeWebhooks:
    Boolean(parsedEnv.STRIPE_SECRET_KEY) &&
    Boolean(parsedEnv.STRIPE_WEBHOOK_SECRET),
  hasEmail: Boolean(parsedEnv.RESEND_API_KEY) && Boolean(parsedEnv.EMAIL_FROM),
  resendApiKey: parsedEnv.RESEND_API_KEY,
  emailFrom: parsedEnv.EMAIL_FROM,
  cronSecret: parsedEnv.CRON_SECRET,
} as const;

export function isConfiguredAdminEmail(email: string) {
  return appConfig.adminEmails.includes(email.trim().toLowerCase());
}
