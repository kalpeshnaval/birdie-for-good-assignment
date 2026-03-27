"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSubscriber } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import {
  addScore,
  createOrUpdateSubscription,
  createWinnerClaim,
  getUserBillingDetails,
  saveProofFile,
  updateCharityPreference,
  updateScore,
} from "@/lib/store";
import { createBillingPortalSession, createCheckoutSession } from "@/lib/stripe";
import { charityPreferenceSchema, scoreSchema } from "@/lib/validation";

function dashboardRedirect(message: string): never {
  redirect(`/dashboard?notice=${encodeURIComponent(message)}`);
}

export async function addScoreAction(formData: FormData) {
  const user = await requireSubscriber();
  const parsed = scoreSchema.safeParse({
    value: formData.get("value"),
    playedAt: formData.get("playedAt"),
  });

  if (!parsed.success) {
    dashboardRedirect(parsed.error.issues[0]?.message ?? "Invalid score entry.");
  }

  await addScore(user.id, parsed.data);
  revalidatePath("/dashboard");
  dashboardRedirect("Score added to your latest five.");
}

export async function updateScoreAction(formData: FormData) {
  const user = await requireSubscriber();
  const parsed = scoreSchema.safeParse({
    value: formData.get("value"),
    playedAt: formData.get("playedAt"),
  });
  const scoreId = String(formData.get("scoreId") ?? "");

  if (!parsed.success || !scoreId) {
    dashboardRedirect("Could not update that score.");
  }

  await updateScore(user.id, {
    scoreId,
    ...parsed.data,
  });

  revalidatePath("/dashboard");
  dashboardRedirect("Score updated.");
}

export async function updateCharityPreferenceAction(formData: FormData) {
  const user = await requireSubscriber();
  const parsed = charityPreferenceSchema.safeParse({
    charityId: formData.get("charityId"),
    charityPercentage: formData.get("charityPercentage"),
  });

  if (!parsed.success) {
    dashboardRedirect("Could not save your charity preference.");
  }

  await updateCharityPreference(user.id, parsed.data);
  revalidatePath("/dashboard");
  dashboardRedirect("Charity preferences updated.");
}

export async function submitClaimAction(formData: FormData) {
  const user = await requireSubscriber();
  const file = formData.get("proof");
  const drawId = String(formData.get("drawId") ?? "");

  if (!(file instanceof File) || !drawId || file.size === 0) {
    dashboardRedirect("Upload a screenshot before submitting.");
  }

  if (file.size > 5_000_000) {
    dashboardRedirect("Proof files must be 5MB or smaller.");
  }

  const proofId = randomUUID();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const proofPath = await saveProofFile(user.id, proofId, file.name, bytes);

  await createWinnerClaim(user.id, {
    drawId,
    proofId,
    proofPath,
    fileName: file.name,
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  dashboardRedirect("Winner proof submitted for review.");
}

export async function changePlanAction(formData: FormData) {
  const user = await requireSubscriber();
  const plan = formData.get("plan");

  if (plan !== "monthly" && plan !== "yearly") {
    dashboardRedirect("Choose a valid plan.");
  }

  const billing = await getUserBillingDetails(user.id);

  if (appConfig.hasStripeCheckout) {
    const checkoutSession = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      plan,
      charityId: user.selectedCharityId ?? "",
      charityPercentage: user.charityPercentage,
      stripeCustomerId: billing.user?.stripeCustomerId ?? null,
    });

    if (checkoutSession?.url) {
      redirect(checkoutSession.url);
    }
  }

  await createOrUpdateSubscription(user.id, {
    plan,
    status: "active",
    provider: "admin",
  });

  revalidatePath("/dashboard");
  dashboardRedirect(
    appConfig.hasStripeCheckout
      ? `Billing session could not start, so ${plan} was saved in manual mode.`
      : `Plan switched to ${plan} in manual billing mode.`,
  );
}

export async function manageBillingAction() {
  const user = await requireSubscriber();
  const billing = await getUserBillingDetails(user.id);

  if (!billing.user?.stripeCustomerId) {
    dashboardRedirect("No Stripe customer record exists yet for this account.");
  }

  const session = await createBillingPortalSession({
    customerId: billing.user.stripeCustomerId,
  });

  if (!session?.url) {
    dashboardRedirect("Stripe billing portal is not configured yet.");
  }

  redirect(session.url);
}
