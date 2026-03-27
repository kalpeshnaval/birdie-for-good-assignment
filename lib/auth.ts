import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/store";

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}

export async function requireUser() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.userId);

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

