import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { appConfig } from "@/lib/config";
import type { SessionUser } from "@/lib/types";

const sessionCookieName = "birdie-for-good-session";
const secretKey = new TextEncoder().encode(appConfig.sessionSecret);

type SessionPayload = SessionUser & {
  exp?: number;
};

export async function createSession(session: SessionUser) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secretKey);
    return {
      userId: payload.userId,
      role: payload.role,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

