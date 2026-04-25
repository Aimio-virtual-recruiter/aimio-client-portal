import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components / Route Handlers.
 * Uses the anon key + user's cookies to determine their identity.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can fail in Server Components — handled by middleware
          }
        },
      },
    }
  );
}

/**
 * Admin Supabase client using the SERVICE ROLE KEY — bypasses RLS.
 * Only use this for admin operations like inviting users.
 * NEVER expose this key to the client.
 */
export function createSupabaseAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/**
 * Get the currently authenticated user + their profile (role, first_name, etc.)
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    role: profile?.role || "client",
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    assigned_client_ids: profile?.assigned_client_ids || [],
    profile,
  };
}
