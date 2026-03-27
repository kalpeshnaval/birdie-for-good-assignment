import "server-only";

import Stripe from "stripe";

import { appConfig, planCatalog } from "@/lib/config";
import { logError } from "@/lib/logger";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/types";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!appConfig.stripeSecretKey) {
    return null;
  }

  stripeClient ??= new Stripe(appConfig.stripeSecretKey);
  return stripeClient;
}

export function getStripePriceId(plan: SubscriptionPlan) {
  return plan === "monthly"
    ? appConfig.stripeMonthlyPriceId
    : appConfig.stripeYearlyPriceId;
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  name: string;
  plan: SubscriptionPlan;
  charityId: string;
  charityPercentage: number;
  stripeCustomerId?: string | null;
}) {
  const stripe = getStripeClient();
  const priceId = getStripePriceId(input.plan);

  if (!stripe || !priceId) {
    return null;
  }

  try {
    return await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${appConfig.appUrl}/dashboard?notice=${encodeURIComponent("Subscription active and ready for the next draw.")}`,
      cancel_url: `${appConfig.appUrl}/signup?notice=${encodeURIComponent("Checkout canceled before activation.")}`,
      customer: input.stripeCustomerId ?? undefined,
      customer_email: input.stripeCustomerId ? undefined : input.email,
      client_reference_id: input.userId,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        user_id: input.userId,
        plan: input.plan,
        charity_id: input.charityId,
        charity_percentage: String(input.charityPercentage),
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: input.userId,
          plan: input.plan,
          charity_id: input.charityId,
          charity_percentage: String(input.charityPercentage),
        },
      },
    });
  } catch (error) {
    logError("stripe.checkout_session_failed", {
      message: error instanceof Error ? error.message : "Unknown Stripe error",
      plan: input.plan,
      userId: input.userId,
      priceId,
    });
    return null;
  }
}

export async function createBillingPortalSession(input: {
  customerId: string;
}) {
  const stripe = getStripeClient();

  if (!stripe) {
    return null;
  }

  try {
    return await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: `${appConfig.appUrl}/dashboard?notice=${encodeURIComponent("Billing session closed.")}`,
    });
  } catch (error) {
    logError("stripe.billing_portal_failed", {
      message: error instanceof Error ? error.message : "Unknown Stripe error",
      customerId: input.customerId,
    });
    return null;
  }
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
    case "paused":
    default:
      return "inactive";
  }
}

export function getPlanFromPriceId(priceId: string | null | undefined): SubscriptionPlan {
  if (priceId && priceId === appConfig.stripeYearlyPriceId) {
    return planCatalog.yearly.id;
  }

  return planCatalog.monthly.id;
}

export function constructStripeEvent(body: string, signature: string | null) {
  const stripe = getStripeClient();

  if (!stripe || !appConfig.stripeWebhookSecret || !signature) {
    throw new Error("Stripe webhook configuration is incomplete.");
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    appConfig.stripeWebhookSecret,
  );
}
