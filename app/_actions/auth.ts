"use server";

import { redirect } from "next/navigation";

import { appConfig } from "@/lib/config";
import { logError } from "@/lib/logger";
import { sendPlatformEmail } from "@/lib/providers";
import { createCheckoutSession } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCharities, provisionUserAccount } from "@/lib/store";
import { authSchema, signupSchema } from "@/lib/validation";

type AuthState = {
  message?: string;
};

const authUserRetryDelayMs = 250;
const authUserRetryCount = 8;

function getAuthUnavailableMessage() {
  return "Supabase auth is not configured yet. Add your Supabase environment variables to enable sign-in.";
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isForeignKeyProvisionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23503"
  );
}

function isObfuscatedExistingUserResponse(user: { identities?: unknown[] } | null | undefined) {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

async function waitForAuthUser(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  for (let attempt = 0; attempt < authUserRetryCount; attempt += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (!error && data.user) {
      return data.user;
    }

    await sleep(authUserRetryDelayMs * (attempt + 1));
  }

  return null;
}

async function provisionUserAccountWithRetry(input: {
  userId: string;
  name: string;
  email: string;
  plan: "monthly" | "yearly";
  charityId: string;
  charityPercentage: number;
}) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await provisionUserAccount(input);
    } catch (error) {
      if (!isForeignKeyProvisionError(error)) {
        throw error;
      }

      lastError = error;
      await sleep(authUserRetryDelayMs * (attempt + 1));
    }
  }

  throw lastError ?? new Error("Could not provision the Supabase profile.");
}

async function repairMissingProfile(userId: string, email: string, name: string) {
  const [defaultCharity] = await listCharities();

  if (!defaultCharity) {
    throw new Error("No charities are configured yet.");
  }

  return provisionUserAccountWithRetry({
    userId,
    name,
    email,
    plan: "monthly",
    charityId: defaultCharity.id,
    charityPercentage: appConfig.defaultCharityPercentage,
  });
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

  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    try {
      await repairMissingProfile(
        data.user.id,
        data.user.email ?? parsed.data.email,
        typeof data.user.user_metadata?.name === "string"
          ? data.user.user_metadata.name
          : parsed.data.email.split("@")[0] ?? "Member",
      );

      const { data: repairedProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      profile = repairedProfile;
    } catch (repairError) {
      logError("supabase.login.profile_repair_failed", {
        userId: data.user.id,
        email: data.user.email ?? parsed.data.email,
        message:
          repairError instanceof Error
            ? repairError.message
            : "Unknown repair error",
      });

      return {
        message:
          "Your auth account exists, but the member profile could not be restored yet. Please try again in a moment.",
      } satisfies AuthState;
    }
  }

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

  if (isObfuscatedExistingUserResponse(data.user)) {
    return {
      message:
        "This email is already registered. Check your inbox for the confirmation email or log in instead.",
    } satisfies AuthState;
  }

  const authUser = await waitForAuthUser(data.user.id);

  if (!authUser) {
    logError("supabase.signup.user_not_available", {
      userId: data.user.id,
      email: parsed.data.email,
    });

    return {
      message:
        "Your account could not be initialized yet. Check your inbox for a confirmation email, then try signing in.",
    } satisfies AuthState;
  }

  let user;

  try {
    user = await provisionUserAccountWithRetry({
      userId: data.user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      plan: parsed.data.plan,
      charityId: parsed.data.charityId,
      charityPercentage: parsed.data.charityPercentage,
    });
  } catch (provisionError) {
    logError("supabase.signup.provision_failed", {
      userId: data.user.id,
      email: parsed.data.email,
      message:
        provisionError instanceof Error
          ? provisionError.message
          : "Unknown provisioning error",
    });

    return {
      message:
        "Your auth account was created, but profile setup did not finish. Try logging in, or retry signup in a moment.",
    } satisfies AuthState;
  }

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
