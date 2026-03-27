import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { appConfig } from "@/lib/config";

const emailOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function getSafeNextPath(candidate: string | null, type: EmailOtpType | null) {
  if (candidate && candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }

  return type === "recovery" ? "/reset-password" : "/confirmed";
}

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }

  return target;
}

function buildRedirectResponse(
  request: NextRequest,
  sourceResponse: NextResponse,
  pathname: string,
  notice: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  url.searchParams.set("notice", notice);
  return copyCookies(sourceResponse, NextResponse.redirect(url));
}

export async function GET(request: NextRequest) {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) {
    return NextResponse.redirect(new URL("/login?notice=Supabase%20auth%20is%20not%20configured.", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const type = rawType && emailOtpTypes.has(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : null;
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"), type);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    appConfig.supabaseUrl,
    appConfig.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            request.cookies.set(cookie.name, cookie.value);
          }

          response = NextResponse.next({ request });

          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return buildRedirectResponse(
        request,
        response,
        nextPath,
        nextPath === "/reset-password"
          ? "Choose a new password for your account."
          : "Email confirmed. Your account is ready.",
      );
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return buildRedirectResponse(
        request,
        response,
        nextPath,
        nextPath === "/reset-password"
          ? "Choose a new password for your account."
          : "Email confirmed. Your account is ready.",
      );
    }
  }

  return buildRedirectResponse(
    request,
    response,
    "/login",
    "That auth link is invalid or has expired. Request a fresh email and try again.",
  );
}