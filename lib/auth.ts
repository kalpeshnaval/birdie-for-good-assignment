import "server-only";

import { redirect } from "next/navigation";

import { appConfig } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

function mapProfile(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role === "admin" ? "admin" : "subscriber",
    createdAt: String(row.created_at),
    selectedCharityId: row.selected_charity_id ? String(row.selected_charity_id) : null,
    charityPercentage: Number(row.charity_percentage ?? appConfig.defaultCharityPercentage),
    avatarSeed: String(row.avatar_seed ?? "member"),
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
  };
}

export async function getCurrentUser() {
  if (!appConfig.hasSupabase) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfile(data);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSubscriber() {
  const user = await requireUser();

  if (user.role !== "subscriber") {
    redirect("/admin");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
