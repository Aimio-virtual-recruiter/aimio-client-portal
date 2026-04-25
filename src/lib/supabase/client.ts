import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser / Client Components.
 * Uses the anon key and persists the session in cookies (same as middleware reads).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
