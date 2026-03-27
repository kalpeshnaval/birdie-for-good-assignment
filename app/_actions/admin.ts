"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { createCharity, createOrUpdateSubscription, reviewClaim, runDraw } from "@/lib/store";
import { charityCreateSchema, claimReviewSchema } from "@/lib/validation";

type DrawMode = "random" | "hot" | "cold";

type SubscriptionStatus = "active" | "inactive" | "canceled" | "past_due";

function adminRedirect(message: string): never {
  redirect(`/admin?notice=${encodeURIComponent(message)}`);
}

function parseDrawMode(value: FormDataEntryValue | null): DrawMode | null {
  return value === "random" || value === "hot" || value === "cold"
    ? value
    : null;
}

export async function simulateDrawAction(formData: FormData) {
  await requireAdmin();
  const mode = parseDrawMode(formData.get("mode"));

  if (!mode) {
    adminRedirect("Choose a valid draw mode.");
  }

  try {
    await runDraw(mode, false);
  } catch (error) {
    logError("admin.simulate_draw_failed", {
      mode,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    adminRedirect("Could not run the draw simulation right now.");
  }

  revalidatePath("/admin");
  adminRedirect("Simulation run complete.");
}

export async function publishDrawAction(formData: FormData) {
  await requireAdmin();
  const mode = parseDrawMode(formData.get("mode"));

  if (!mode) {
    adminRedirect("Choose a valid draw mode.");
  }

  try {
    await runDraw(mode, true);
  } catch (error) {
    logError("admin.publish_draw_failed", {
      mode,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    adminRedirect("Could not publish the live draw right now.");
  }

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

  try {
    await createCharity(parsed.data);
  } catch (error) {
    logError("admin.create_charity_failed", {
      name: parsed.data.name,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    adminRedirect("Could not add that charity right now.");
  }

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

  try {
    await reviewClaim(parsed.data.claimId, {
      reviewStatus: parsed.data.reviewStatus,
      paymentStatus: parsed.data.paymentStatus,
      notes: parsed.data.notes,
    });
  } catch (error) {
    logError("admin.review_claim_failed", {
      claimId: parsed.data.claimId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    adminRedirect("Could not save that claim review right now.");
  }

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
    (status !== "active" && status !== "inactive" && status !== "canceled" && status !== "past_due")
  ) {
    adminRedirect("Subscriber plan update failed.");
  }

  try {
    await createOrUpdateSubscription(userId, {
      plan,
      status: status as SubscriptionStatus,
      provider: "admin",
    });
  } catch (error) {
    logError("admin.update_subscription_failed", {
      userId,
      plan,
      status,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    adminRedirect("Could not update that subscriber plan right now.");
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  adminRedirect("Subscriber plan updated.");
}
