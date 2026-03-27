import "server-only";

import { createClient } from "@supabase/supabase-js";

import { appConfig } from "@/lib/config";

export function createSupabaseAdminClient() {
  if (
    !appConfig.supabaseUrl ||
    !appConfig.supabasePublishableKey ||
    !appConfig.supabaseServiceRoleKey
  ) {
    throw new Error(
      "Missing Supabase admin configuration. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(
    appConfig.supabaseUrl,
    appConfig.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
