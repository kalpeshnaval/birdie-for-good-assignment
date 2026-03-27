import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { appConfig } from "@/lib/config";

export async function createSupabaseServerClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    appConfig.supabaseUrl,
    appConfig.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            }
          } catch {
            // Server Components cannot always write cookies. Proxy and Server Actions cover refresh flows.
          }
        },
      },
    },
  );
}
