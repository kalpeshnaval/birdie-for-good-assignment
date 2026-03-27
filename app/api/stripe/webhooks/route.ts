import { format } from "date-fns";
import Stripe from "stripe";

import { logError, logInfo } from "@/lib/logger";
import { constructStripeEvent, getPlanFromPriceId, mapStripeStatus } from "@/lib/stripe";
import { findUserIdByStripeCustomerId, syncStripeCheckoutCompleted, syncStripeSubscription } from "@/lib/store";
import type { SubscriptionPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

function toDateString(unixSeconds: number | null | undefined) {
  if (!unixSeconds) {
    return format(new Date(), "yyyy-MM-dd");
  }

  return format(new Date(unixSeconds * 1000), "yyyy-MM-dd");
}

function getUserIdFromMetadata(metadata: Stripe.Metadata | null | undefined) {
  const userId = metadata?.user_id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

function getPriceId(value: string | Stripe.Price | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}
function getPlan(metadata: Stripe.Metadata | null | undefined, priceId: string | null | undefined): SubscriptionPlan {
  if (metadata?.plan === "yearly") {
    return "yearly";
  }

  return getPlanFromPriceId(priceId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = constructStripeEvent(body, signature);
  } catch (error) {
    logError("stripe.webhook.invalid_signature", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ ok: false, message: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
        const userId = session.client_reference_id ?? getUserIdFromMetadata(session.metadata);
        const plan = getPlan(session.metadata, null);

        if (userId) {
          await syncStripeCheckoutCompleted({
            userId,
            customerId,
            subscriptionId,
            priceId: null,
            plan,
          });
        }

        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
        const activeItem = subscription.items.data[0];
        const priceId = activeItem?.price?.id ?? null;
        const userId = getUserIdFromMetadata(subscription.metadata) ?? (customerId ? await findUserIdByStripeCustomerId(customerId) : null);

        if (userId) {
          await syncStripeSubscription({
            userId,
            customerId,
            subscriptionId: subscription.id,
            priceId,
            plan: getPlan(subscription.metadata, priceId),
            status: mapStripeStatus(subscription.status),
            startedAt: toDateString(activeItem?.current_period_start),
            renewalDate: toDateString(activeItem?.current_period_end),
            canceledAt: subscription.canceled_at ? toDateString(subscription.canceled_at) : null,
          });
        }

        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
        const userId = customerId ? await findUserIdByStripeCustomerId(customerId) : null;
        const priceId = getPriceId(invoice.lines.data[0]?.pricing?.price_details?.price ?? null);

        if (userId) {
          await syncStripeSubscription({
            userId,
            customerId,
            subscriptionId:
              typeof invoice.parent?.subscription_details?.subscription === "string"
                ? invoice.parent.subscription_details.subscription
                : "invoice-failed",
            priceId,
            plan: getPlan(null, priceId),
            status: "past_due",
            startedAt: format(new Date(), "yyyy-MM-dd"),
            renewalDate: format(new Date(), "yyyy-MM-dd"),
          });
        }

        break;
      }
      default:
        break;
    }

    logInfo("stripe.webhook.processed", { type: event.type });
    return Response.json({ ok: true, received: true });
  } catch (error) {
    logError("stripe.webhook.processing_failed", {
      type: event.type,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ ok: false, message: "Webhook handling failed." }, { status: 500 });
  }
}



