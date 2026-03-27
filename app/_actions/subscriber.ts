"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSubscriber } from "@/lib/auth";
import {
  addScore,
  createOrUpdateSubscription,
  saveProofFile,
  submitClaim,
  updateCharityPreference,
  updateScore,
} from "@/lib/store";
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

  const claim = await submitClaim(user.id, {
    drawId,
    fileName: file.name,
  });
  const bytes = new Uint8Array(await file.arrayBuffer());
  await saveProofFile(claim.proofId, file.name, bytes);

  revalidatePath("/dashboard");
  dashboardRedirect("Winner proof submitted for review.");
}

export async function changePlanAction(formData: FormData) {
  const user = await requireSubscriber();
  const plan = formData.get("plan");

  if (plan !== "monthly" && plan !== "yearly") {
    dashboardRedirect("Choose a valid plan.");
  }

  await createOrUpdateSubscription(user.id, {
    plan,
    status: "active",
  });

  revalidatePath("/dashboard");
  dashboardRedirect(`Plan switched to ${plan}.`);
}

