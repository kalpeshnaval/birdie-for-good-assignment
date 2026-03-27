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

function normalizeEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getConfiguredEnvValue(value: string | undefined) {
  const normalized = normalizeEnvValue(value);

  if (!normalized) {
    return undefined;
  }

  const lowerCasedValue = normalized.toLowerCase();
  const placeholderPatterns = [
    "xxxxxxxx",
    "placeholder",
    "your-project-ref",
    "change-this",
  ];

  if (placeholderPatterns.some((pattern) => lowerCasedValue.includes(pattern))) {
    return undefined;
  }

  return normalized;
}

const configuredEnv = {
  appUrl: getConfiguredEnvValue(parsedEnv.NEXT_PUBLIC_APP_URL),
  supabaseUrl: getConfiguredEnvValue(parsedEnv.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: getConfiguredEnvValue(
    parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  supabaseServiceRoleKey: getConfiguredEnvValue(
    parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  ),
  proofsBucket: normalizeEnvValue(parsedEnv.SUPABASE_PROOFS_BUCKET),
  stripeSecretKey: getConfiguredEnvValue(parsedEnv.STRIPE_SECRET_KEY),
  stripeWebhookSecret: getConfiguredEnvValue(parsedEnv.STRIPE_WEBHOOK_SECRET),
  stripeMonthlyPriceId: getConfiguredEnvValue(parsedEnv.STRIPE_MONTHLY_PRICE_ID),
  stripeYearlyPriceId: getConfiguredEnvValue(parsedEnv.STRIPE_YEARLY_PRICE_ID),
  resendApiKey: getConfiguredEnvValue(parsedEnv.RESEND_API_KEY),
  emailFrom: getConfiguredEnvValue(parsedEnv.EMAIL_FROM),
  cronSecret: getConfiguredEnvValue(parsedEnv.CRON_SECRET),
};

const adminEmails = (parsedEnv.PLATFORM_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export const appConfig = {
  appName: "Birdie for Good",
  appUrl: configuredEnv.appUrl ?? "http://localhost:3000",
  defaultCharityPercentage: 10,
  minimumCharityPercentage: 10,
  prizePoolPercentage: 35,
  scoreRange: {
    min: 1,
    max: 45,
  },
  maxScoresPerUser: 5,
  adminEmails,
  supabaseUrl: configuredEnv.supabaseUrl,
  supabasePublishableKey: configuredEnv.supabasePublishableKey,
  supabaseServiceRoleKey: configuredEnv.supabaseServiceRoleKey,
  proofsBucket: configuredEnv.proofsBucket ?? "winner-proofs",
  hasSupabase:
    Boolean(configuredEnv.supabaseUrl) &&
    Boolean(configuredEnv.supabasePublishableKey),
  hasSupabaseAdmin:
    Boolean(configuredEnv.supabaseUrl) &&
    Boolean(configuredEnv.supabasePublishableKey) &&
    Boolean(configuredEnv.supabaseServiceRoleKey),
  stripeSecretKey: configuredEnv.stripeSecretKey,
  stripeWebhookSecret: configuredEnv.stripeWebhookSecret,
  stripeMonthlyPriceId: configuredEnv.stripeMonthlyPriceId,
  stripeYearlyPriceId: configuredEnv.stripeYearlyPriceId,
  hasStripeCheckout:
    Boolean(configuredEnv.stripeSecretKey) &&
    Boolean(configuredEnv.stripeMonthlyPriceId) &&
    Boolean(configuredEnv.stripeYearlyPriceId),
  hasStripeWebhooks:
    Boolean(configuredEnv.stripeSecretKey) &&
    Boolean(configuredEnv.stripeWebhookSecret),
  hasEmail:
    Boolean(configuredEnv.resendApiKey) && Boolean(configuredEnv.emailFrom),
  resendApiKey: configuredEnv.resendApiKey,
  emailFrom: configuredEnv.emailFrom,
  cronSecret: configuredEnv.cronSecret,
} as const;

export function isConfiguredAdminEmail(email: string) {
  return appConfig.adminEmails.includes(email.trim().toLowerCase());
}
