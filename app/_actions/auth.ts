"use server";

import { redirect } from "next/navigation";

import { appConfig } from "@/lib/config";
import { sendPlatformEmail } from "@/lib/providers";
import { createCheckoutSession } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { provisionUserAccount } from "@/lib/store";
import { authSchema, signupSchema } from "@/lib/validation";

type AuthState = {
  message?: string;
};

function getAuthUnavailableMessage() {
  return "Supabase auth is not configured yet. Add your Supabase environment variables to enable sign-in.";
}

export async function loginAction(_: AuthState, formData: FormData) {
  if (!appConfig.hasSupabase) {
    return { message: getAuthUnavailableMessage() } satisfies AuthState;
  }

  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Please check your login details.",
    } satisfies AuthState;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      message: error?.message ?? "The email or password is incorrect.",
    } satisfies AuthState;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
}

export async function signupAction(_: AuthState, formData: FormData) {
  if (!appConfig.hasSupabase || !appConfig.hasSupabaseAdmin) {
    return {
      message:
        "Supabase is not configured yet. Add the Supabase URL, publishable key, and service role key to enable signup.",
    } satisfies AuthState;
  }

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    plan: formData.get("plan"),
    charityId: formData.get("charityId"),
    charityPercentage: Number(formData.get("charityPercentage")),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Please review the signup form.",
    } satisfies AuthState;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (error || !data.user) {
    return {
      message: error?.message ?? "Could not create your account.",
    } satisfies AuthState;
  }

  const user = await provisionUserAccount({
    userId: data.user.id,
    name: parsed.data.name,
    email: parsed.data.email,
    plan: parsed.data.plan,
    charityId: parsed.data.charityId,
    charityPercentage: parsed.data.charityPercentage,
  });

  await sendPlatformEmail({
    to: parsed.data.email,
    subject: "Welcome to Birdie for Good",
    html: `<p>Your account is ready. Next up: activate billing, manage scores, and track monthly draw momentum.</p>`,
  });

  if (user?.role === "admin") {
    redirect("/admin?notice=Admin%20account%20created");
  }

  const checkoutSession = await createCheckoutSession({
    userId: data.user.id,
    email: parsed.data.email,
    name: parsed.data.name,
    plan: parsed.data.plan,
    charityId: parsed.data.charityId,
    charityPercentage: parsed.data.charityPercentage,
    stripeCustomerId: user?.stripeCustomerId ?? null,
  });

  if (checkoutSession?.url) {
    redirect(checkoutSession.url);
  }

  if (!data.session) {
    redirect("/login?notice=Account%20created.%20Verify%20your%20email%20and%20sign%20in.");
  }

  redirect(
    "/dashboard?notice=" +
      encodeURIComponent(
        appConfig.hasStripeCheckout
          ? "Account created. Finish billing activation from your dashboard if needed."
          : "Account created. Stripe is not configured, so billing is in manual mode.",
      ),
  );
}

export async function logoutAction() {
  if (appConfig.hasSupabase) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
