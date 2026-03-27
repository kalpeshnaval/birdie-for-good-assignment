"use server";

import { redirect } from "next/navigation";

import { createSession, clearSession } from "@/lib/session";
import { findUserByEmail, createUser } from "@/lib/store";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { signupSchema, authSchema } from "@/lib/validation";
import { sendPlatformEmail } from "@/lib/providers";

type AuthState = {
  message?: string;
};

export async function loginAction(_: AuthState, formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Please check your login details.",
    } satisfies AuthState;
  }

  const user = await findUserByEmail(parsed.data.email);

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return {
      message: "The email or password is incorrect.",
    } satisfies AuthState;
  }

  await createSession({
    userId: user.id,
    role: user.role,
  });

  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function signupAction(_: AuthState, formData: FormData) {
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

  const user = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
    plan: parsed.data.plan,
    charityId: parsed.data.charityId,
    charityPercentage: parsed.data.charityPercentage,
  });

  await sendPlatformEmail({
    to: user.email,
    subject: "Welcome to Birdie for Good",
    html: `<p>Your account is ready. You can now manage scores, charity impact, and monthly draw entries.</p>`,
  });

  await createSession({
    userId: user.id,
    role: user.role,
  });

  redirect("/dashboard?notice=Welcome%20aboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

