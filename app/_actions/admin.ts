"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  createCharity,
  createOrUpdateSubscription,
  reviewClaim,
  runDraw,
} from "@/lib/store";
import { charityCreateSchema, claimReviewSchema } from "@/lib/validation";

type DrawMode = "random" | "hot" | "cold";

type SubscriptionStatus = "active" | "inactive" | "canceled" | "past_due";

function adminRedirect(message: string): never {
  redirect(`/admin?notice=${encodeURIComponent(message)}`);
}

export async function simulateDrawAction(formData: FormData) {
  await requireAdmin();
  const mode = String(formData.get("mode") ?? "random") as DrawMode;
  await runDraw(mode, false);
  revalidatePath("/admin");
  adminRedirect("Simulation run complete.");
}

export async function publishDrawAction(formData: FormData) {
  await requireAdmin();
  const mode = String(formData.get("mode") ?? "random") as DrawMode;
  await runDraw(mode, true);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
  adminRedirect("Draw published and participants notified.");
}

export async function createCharityAction(formData: FormData) {
  await requireAdmin();
  const parsed = charityCreateSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    headline: formData.get("headline"),
    summary: formData.get("summary"),
  });

  if (!parsed.success) {
    adminRedirect(parsed.error.issues[0]?.message ?? "Charity details are incomplete.");
  }

  await createCharity(parsed.data);
  revalidatePath("/admin");
  revalidatePath("/charities");
  adminRedirect("Charity added.");
}

export async function reviewClaimAction(formData: FormData) {
  await requireAdmin();
  const parsed = claimReviewSchema.safeParse({
    claimId: formData.get("claimId"),
    reviewStatus: formData.get("reviewStatus"),
    paymentStatus: formData.get("paymentStatus"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    adminRedirect("Claim review failed validation.");
  }

  await reviewClaim(parsed.data.claimId, {
    reviewStatus: parsed.data.reviewStatus,
    paymentStatus: parsed.data.paymentStatus,
    notes: parsed.data.notes,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  adminRedirect("Claim reviewed.");
}

export async function updateSubscriberPlanAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const plan = formData.get("plan");
  const status = formData.get("status");

  if (
    !userId ||
    (plan !== "monthly" && plan !== "yearly") ||
    (status !== "active" &&
      status !== "inactive" &&
      status !== "canceled" &&
      status !== "past_due")
  ) {
    adminRedirect("Subscriber plan update failed.");
  }

  await createOrUpdateSubscription(userId, {
    plan,
    status: status as SubscriptionStatus,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  adminRedirect("Subscriber plan updated.");
}

