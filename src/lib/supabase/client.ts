import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || "https://placeholder-project.supabase.co";
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || "placeholder-anon-key";

export function createClient(schema?: string) {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    ...(schema ? { db: { schema } } : {}),
  });
}

/**
 * Creates browser client bound to master_db schema for Admin operations.
 */
export function createMasterClient() {
  return createClient("master_db");
}

/**
 * Creates browser client bound to org/campus schema for Borrower and Lender operations.
 */
export function createOrgClient(orgSchema = "org_rmse_waverock") {
  return createClient(orgSchema);
}
