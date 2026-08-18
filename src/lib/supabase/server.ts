import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || "https://placeholder-project.supabase.co";
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || "placeholder-anon-key";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim() || "placeholder-service-key";

export async function createClient(schema?: string) {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    ...(schema ? { db: { schema } } : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore when
          // middleware is refreshing the session.
        }
      },
    },
  });
}

/**
 * Server client bound to master_db schema for Admin role queries.
 */
export async function createMasterClient() {
  return createClient("master_db");
}

/**
 * Server client bound to specific Org/Campus schema for Borrower and Lender queries.
 */
export async function createOrgClient(orgSchema = "org_rmse_waverock") {
  return createClient(orgSchema);
}

/**
 * Service-role client. NEVER expose to the browser. Use only in Route
 * Handlers / Server Actions that need to bypass RLS deliberately.
 */
export function createServiceRoleClient(schema?: string) {
  return createRawClient(supabaseUrl, serviceRoleKey, {
    ...(schema ? { db: { schema } } : {}),
    auth: { persistSession: false },
  });
}

export function createMasterServiceRoleClient() {
  return createServiceRoleClient("master_db");
}
