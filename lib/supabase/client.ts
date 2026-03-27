"use client";

import { createBrowserClient } from "@supabase/ssr";

import { appConfig } from "@/lib/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  browserClient ??= createBrowserClient(
    appConfig.supabaseUrl,
    appConfig.supabasePublishableKey,
  );

  return browserClient;
}
